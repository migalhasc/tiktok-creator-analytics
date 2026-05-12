import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "../supabase-admin";
import { TikTokInfrastructureError } from "../domain/provider-errors";
import type {
  CachedProfileSnapshot,
  FetchFailureInput,
  PostDailySnapshotRow,
  PersistSnapshotInput,
  PlaceholderProfileInput,
  PostRow,
  ProfileDailySnapshotRow,
  ProfileRow,
} from "../domain/tiktok-types";

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function isOptionalHistorySchemaError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) {
    return false;
  }

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.message?.includes("profile_daily_snapshots") === true ||
    error.message?.includes("post_daily_snapshots") === true
  );
}

export class TikTokRepository {
  constructor(private readonly client: SupabaseClient = getSupabaseAdminClient()) {}

  async getProfileSnapshot(username: string): Promise<CachedProfileSnapshot | null> {
    const { data: profile, error } = await this.client
      .from("profiles")
      .select("*")
      .eq("username", username.toLowerCase())
      .maybeSingle();

    if (error) {
      throw this.toInfrastructureError(error.message);
    }

    if (!profile) {
      return null;
    }

    const { data: posts, error: postsError } = await this.client
      .from("posts")
      .select("*")
      .eq("profile_id", profile.id)
      .order("published_at", { ascending: false });

    if (postsError) {
      throw this.toInfrastructureError(postsError.message);
    }

    return {
      profile: profile as ProfileRow,
      posts: (posts ?? []) as PostRow[],
    };
  }

  async markProfileRefreshing(username: string): Promise<void> {
    const { error } = await this.client
      .from("profiles")
      .update({
        cache_status: "refreshing",
        last_refresh_started_at: new Date().toISOString(),
        last_error_code: null,
        last_error_message: null,
      })
      .eq("username", username.toLowerCase());

    if (error) {
      throw this.toInfrastructureError(error.message);
    }
  }

  async markProfileStale(username: string): Promise<void> {
    const { error } = await this.client
      .from("profiles")
      .update({
        cache_status: "stale",
      })
      .eq("username", username.toLowerCase());

    if (error) {
      throw this.toInfrastructureError(error.message);
    }
  }

  async ensurePlaceholderSnapshot(input: PlaceholderProfileInput): Promise<CachedProfileSnapshot> {
    const placeholderPayload = {
      metric_support: {
        likes: true,
        comments: true,
        shares: true,
        views: true,
        saves: true,
        reposts: false,
      },
      placeholder: true,
      ...(input.providerPayload ?? {}),
    };

    const { error } = await this.client.from("profiles").insert({
      username: input.username.toLowerCase(),
      profile_url: input.profileUrl,
      provider_payload: placeholderPayload,
      cache_status: "refreshing",
      last_fetched_at: null,
      last_refresh_started_at: null,
      last_error_code: null,
      last_error_message: null,
    });

    if (error && error.code !== "23505") {
      throw this.toInfrastructureError(error.message);
    }

    const snapshot = await this.getProfileSnapshot(input.username);
    if (!snapshot) {
      throw this.toInfrastructureError("Falha ao criar o placeholder do perfil.");
    }

    return snapshot;
  }

  async markProfileError(input: FetchFailureInput): Promise<void> {
    if (input.profileId) {
      const { error } = await this.client
        .from("profiles")
        .update({
          cache_status: "error",
          last_error_code: input.errorCode,
          last_error_message: input.errorMessage,
        })
        .eq("id", input.profileId);

      if (error) {
        throw this.toInfrastructureError(error.message);
      }
    }

    await this.recordFetchRun({
      profileId: input.profileId ?? null,
      username: input.username,
      source: input.source,
      status: "failed",
      errorCode: input.errorCode,
      errorMessage: input.errorMessage,
      providerPayload: input.providerPayload ?? {},
      recordsCount: 0,
    });
  }

  async getProfileDailySnapshots(profileId: string, startDate: string, endDate: string): Promise<ProfileDailySnapshotRow[]> {
    const { data, error } = await this.client
      .from("profile_daily_snapshots")
      .select("*")
      .eq("profile_id", profileId)
      .gte("snapshot_date", startDate)
      .lte("snapshot_date", endDate)
      .order("snapshot_date", { ascending: true });

    if (error) {
      if (isOptionalHistorySchemaError(error)) {
        return [];
      }

      throw this.toInfrastructureError(error.message);
    }

    return (data ?? []) as ProfileDailySnapshotRow[];
  }

  async getPostDailySnapshots(postIds: string[], startDate: string, endDate: string): Promise<PostDailySnapshotRow[]> {
    if (postIds.length === 0) {
      return [];
    }

    // PostgREST builds a very large filter for `.in()`; many posts (e.g. large creators) exceed URL/body limits.
    const chunkSize = 80;
    const merged: PostDailySnapshotRow[] = [];

    for (let offset = 0; offset < postIds.length; offset += chunkSize) {
      const chunk = postIds.slice(offset, offset + chunkSize);
      const { data, error } = await this.client
        .from("post_daily_snapshots")
        .select("*")
        .in("post_id", chunk)
        .gte("snapshot_date", startDate)
        .lte("snapshot_date", endDate)
        .order("snapshot_date", { ascending: true });

      if (error) {
        if (isOptionalHistorySchemaError(error)) {
          return [];
        }

        throw this.toInfrastructureError(error.message);
      }

      merged.push(...((data ?? []) as PostDailySnapshotRow[]));
    }

    merged.sort((left, right) => {
      const byPost = left.post_id.localeCompare(right.post_id);
      return byPost !== 0 ? byPost : left.snapshot_date.localeCompare(right.snapshot_date);
    });

    return merged;
  }

  async persistSnapshot(input: PersistSnapshotInput): Promise<CachedProfileSnapshot> {
    const profilePayload = {
      ...input.profile.providerPayload,
      metric_support: input.profile.metricSupport,
    };

    const { data: profile, error } = await this.client
      .from("profiles")
      .upsert(
        {
          username: input.profile.username,
          profile_url: input.profile.profileUrl,
          display_name: input.profile.displayName,
          biography: input.profile.biography,
          followers: input.profile.followers,
          following: input.profile.following,
          likes: input.profile.likes,
          videos_count: input.profile.videosCount,
          is_verified: input.profile.isVerified,
          avatar_url: input.profile.avatarUrl,
          provider_payload: profilePayload,
          cache_status: "fresh",
          last_fetched_at: input.fetchedAt,
          last_refresh_started_at: input.fetchedAt,
          last_error_code: null,
          last_error_message: null,
        },
        {
          onConflict: "username",
        },
      )
      .select("*")
      .single();

    if (error || !profile) {
      throw this.toInfrastructureError(error?.message ?? "Falha ao salvar o perfil.");
    }

    if (input.posts.length > 0) {
      const rows = input.posts.map((post) => ({
        profile_id: profile.id,
        tiktok_post_id: post.tiktokPostId,
        post_url: post.postUrl,
        author_username: post.authorUsername,
        description: post.description,
        hashtags: post.hashtags,
        published_at: post.publishedAt,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        views: post.views,
        saves: post.saves,
        reposts: post.reposts,
        video_url: post.videoUrl,
        thumbnail_url: post.thumbnailUrl,
        provider_payload: post.providerPayload,
        last_seen_at: input.fetchedAt,
      }));

      const { data: persistedPosts, error: postsError } = await this.client
        .from("posts")
        .upsert(rows, {
          onConflict: "profile_id,tiktok_post_id",
        })
        .select("id, tiktok_post_id");

      if (postsError || !persistedPosts) {
        throw this.toInfrastructureError(postsError?.message ?? "Falha ao salvar os posts.");
      }

    }

    const { error: deleteError } = await this.client
      .from("posts")
      .delete()
      .eq("profile_id", profile.id)
      .lt("last_seen_at", input.fetchedAt);

    if (deleteError) {
      throw this.toInfrastructureError(deleteError.message);
    }

    await this.recordFetchRun({
      profileId: profile.id,
      username: (profile as ProfileRow).username,
      source: input.source,
      status: "success",
      recordsCount: input.posts.length,
      providerPayload: {
        metric_support: input.profile.metricSupport,
      },
    });

    return (await this.getProfileSnapshot((profile as ProfileRow).username)) as CachedProfileSnapshot;
  }

  private async recordFetchRun(input: {
    profileId: string | null;
    username: string;
    source: string;
    status: "success" | "failed";
    recordsCount: number;
    errorCode?: string;
    errorMessage?: string;
    providerPayload?: Record<string, unknown>;
  }): Promise<void> {
    const { error } = await this.client.from("fetch_runs").insert({
      profile_id: input.profileId,
      username: input.username,
      source: input.source,
      status: input.status,
      records_count: input.recordsCount,
      error_code: input.errorCode ?? null,
      error_message: input.errorMessage ?? null,
      provider_payload: toRecord(input.providerPayload),
      finished_at: new Date().toISOString(),
    });

    if (error) {
      throw this.toInfrastructureError(error.message);
    }
  }

  private toInfrastructureError(message: string): TikTokInfrastructureError {
    return new TikTokInfrastructureError({
      message,
    });
  }
}
