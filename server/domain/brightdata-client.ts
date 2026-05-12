import { buildProfileUrl } from "@shared/profile-input";
import { getServerEnv, type ServerEnv } from "../env";
import { TikTokProviderError } from "./provider-errors";
import type { MetricSupport, NormalizedPost, NormalizedProfile } from "./tiktok-types";

type FetchLike = typeof fetch;

type SnapshotProgressResponse = {
  status?: string;
};

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function extractUsernameFromProfileUrl(value: unknown): string | null {
  const rawUrl = toNullableString(value);
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    const match = url.pathname.match(/^\/@([A-Za-z0-9._-]+)\/?$/);
    return match?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

function buildPostUrl(profileUrl: string | null, postId: string | null): string | null {
  const normalizedProfileUrl = toNullableString(profileUrl);
  const normalizedPostId = toNullableString(postId);

  if (!normalizedProfileUrl || !normalizedPostId) {
    return null;
  }

  return `${normalizedProfileUrl.replace(/\/$/, "")}/video/${normalizedPostId}`;
}

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toNullableBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return null;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          return (
            toNullableString(record.hashtag_name) ??
            toNullableString(record.hashtagName) ??
            toNullableString(record.name) ??
            ""
          );
        }
        return "";
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim().replace(/^#/, ""))
      .filter(Boolean);
  }

  return [];
}

function pickFirst<T>(...values: Array<T | null | undefined>): T | null {
  for (const value of values) {
    if (value != null) return value;
  }
  return null;
}

function getPostId(postUrl: string, rawPost: Record<string, unknown>): string {
  const directId = pickFirst(
    toNullableString(rawPost.aweme_id),
    toNullableString(rawPost.id),
    toNullableString(rawPost.post_id),
  );
  if (directId) return directId;

  const match = postUrl.match(/\/video\/(\d+)/);
  return match?.[1] ?? postUrl;
}

function toNullableDateString(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const timestamp = value > 9_999_999_999 ? value : value * 1000;
    return new Date(timestamp).toISOString();
  }

  if (typeof value === "string" && value.trim()) {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) {
      const timestamp = asNumber > 9_999_999_999 ? asNumber : asNumber * 1000;
      return new Date(timestamp).toISOString();
    }

    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class BrightDataTikTokClient {
  private readonly env: ServerEnv;
  private readonly fetchImpl: FetchLike;
  private readonly asyncWaitMs: number;
  private readonly asyncTimeoutMs: number;

  constructor(args?: { env?: ServerEnv; fetchImpl?: FetchLike }) {
    this.env = args?.env ?? getServerEnv();
    this.fetchImpl = args?.fetchImpl ?? fetch;
    this.asyncWaitMs = this.env.BRIGHTDATA_ASYNC_POLL_INTERVAL_MS;
    this.asyncTimeoutMs = this.env.BRIGHTDATA_ASYNC_TIMEOUT_MS;
  }

  async fetchProfile(profileUrl: string): Promise<NormalizedProfile> {
    const records = await this.scrapeDataset(this.env.BRIGHTDATA_TIKTOK_PROFILES_DATASET, profileUrl);
    const rawProfile = records[0];
    if (!rawProfile) {
      throw new TikTokProviderError({
        code: "NOT_FOUND",
        message: "Profile not found",
        status: 404,
      });
    }

    const record = toRecord(rawProfile);
    const username = pickFirst(
      extractUsernameFromProfileUrl(record.url),
      extractUsernameFromProfileUrl(profileUrl),
      toNullableString(record.unique_id),
      toNullableString(record.username),
      toNullableString(record.handle),
      toNullableString(record.account_id),
      toNullableString(record.profile_username),
    );

    if (!username) {
      throw new TikTokProviderError({
        code: "BAD_RESPONSE",
        message: "Bright Data profile response did not include username",
        status: 502,
        retryable: false,
        providerPayload: record,
      });
    }

    return {
      username: username.toLowerCase(),
      profileUrl: buildProfileUrl(username),
      displayName: pickFirst(
        toNullableString(record.nickname),
        toNullableString(record.display_name),
        toNullableString(record.profile_name),
      ),
      biography: pickFirst(
        toNullableString(record.signature),
        toNullableString(record.biography),
        toNullableString(record.bio),
      ),
      followers: pickFirst(toNullableNumber(record.follower_count), toNullableNumber(record.followers)),
      following: pickFirst(toNullableNumber(record.following_count), toNullableNumber(record.following)),
      likes: pickFirst(toNullableNumber(record.total_favorited), toNullableNumber(record.likes)),
      videosCount: pickFirst(
        toNullableNumber(record.aweme_count),
        toNullableNumber(record.videos_count),
        toNullableNumber(record.posts_count),
      ),
      isVerified: pickFirst(toNullableBoolean(record.is_verified), toNullableBoolean(record.verified)),
      avatarUrl: pickFirst(
        toNullableString(record.avatar_larger),
        toNullableString(record.avatar_url),
        toNullableString(record.avatar_medium),
        toNullableString(record.profile_pic_url),
        toNullableString(record.profile_pic_url_hd),
      ),
      providerPayload: {
        raw_profile: record,
      },
      metricSupport: {
        likes: true,
        comments: true,
        shares: true,
        views: true,
        saves: true,
        reposts: false,
      },
    };
  }

  async fetchPostsByProfile(profileUrl: string, authorUsername: string): Promise<{ posts: NormalizedPost[]; metricSupport: MetricSupport }> {
    const records = await this.scrapeDataset(this.env.BRIGHTDATA_TIKTOK_POSTS_BY_PROFILE_DATASET, profileUrl);

    const posts = records.flatMap((rawPost) => {
      const record = toRecord(rawPost);
      const derivedProfileUrl = pickFirst(
        toNullableString(record.profile_url),
        toNullableString(record.author_profile_url),
        profileUrl,
      );
      const postId = pickFirst(
        toNullableString(record.post_id),
        toNullableString(record.aweme_id),
        toNullableString(record.id),
      );
      const postUrl = pickFirst(
        toNullableString(record.url),
        toNullableString(record.share_url),
        toNullableString(record.web_url),
        buildPostUrl(derivedProfileUrl, postId),
      );

      if (!postUrl) {
        return [];
      }

      const author = pickFirst(
        toNullableString(record.author_username),
        toNullableString(record.profile_username),
        toNullableString(record.unique_id),
        toNullableString(record.author_unique_id),
        toNullableString(record.author),
        extractUsernameFromProfileUrl(derivedProfileUrl),
      );

      return [
        {
          tiktokPostId: getPostId(postUrl, record),
          postUrl,
          authorUsername: (author ?? authorUsername).toLowerCase(),
          description: pickFirst(
            toNullableString(record.desc),
            toNullableString(record.description),
            toNullableString(record.caption),
          ),
          hashtags: toStringArray(pickFirst(record.hashtags, record.text_extra)),
          publishedAt: pickFirst(
            toNullableDateString(record.create_time_iso),
            toNullableDateString(record.create_time),
            toNullableDateString(record.createTime),
            toNullableDateString(record.published_at),
            toNullableDateString(record.date_posted),
          ),
          likes: pickFirst(
            toNullableNumber(record.digg_count),
            toNullableNumber(record.diggCount),
            toNullableNumber(record.like_count),
            toNullableNumber(record.likes),
          ),
          comments: pickFirst(
            toNullableNumber(record.comment_count),
            toNullableNumber(record.commentCount),
            toNullableNumber(record.comments),
          ),
          shares: pickFirst(
            toNullableNumber(record.share_count),
            toNullableNumber(record.shareCount),
            toNullableNumber(record.shares),
          ),
          views: pickFirst(
            toNullableNumber(record.play_count),
            toNullableNumber(record.playCount),
            toNullableNumber(record.views),
          ),
          saves: pickFirst(
            toNullableNumber(record.collect_count),
            toNullableNumber(record.collectCount),
            toNullableNumber(record.save_count),
            toNullableNumber(record.saveCount),
            toNullableNumber(record.favorites_count),
            toNullableNumber(record.favorite_count),
            toNullableNumber(record.favoriteCount),
            toNullableNumber(record.favorites),
            toNullableNumber(record.saves),
          ),
          reposts: null,
          videoUrl: pickFirst(toNullableString(record.video_url), toNullableString(record.download_url)),
          thumbnailUrl: pickFirst(
            toNullableString(record.cover_url),
            toNullableString(record.coverUrl),
            toNullableString(record.cover_image),
            toNullableString(record.thumbnail_url),
            toNullableString(record.origin_cover),
          ),
          providerPayload: record,
        },
      ];
    });

    return {
      posts,
      metricSupport: {
        likes: true,
        comments: true,
        shares: true,
        views: true,
        saves: true,
        reposts: false,
      },
    };
  }

  private async scrapeDataset(datasetId: string, profileUrl: string): Promise<unknown[]> {
    if (!this.env.BRIGHTDATA_API_TOKEN) {
      throw new TikTokProviderError({
        code: "CONFIGURATION",
        message: "Missing Bright Data token",
        status: 500,
      });
    }

    const response = await this.fetchImpl(
      `https://api.brightdata.com/datasets/v3/scrape?dataset_id=${encodeURIComponent(datasetId)}&format=json`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.env.BRIGHTDATA_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{ url: profileUrl }]),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw this.mapHttpError(response.status, errorText);
    }

    const payload = (await response.json()) as unknown;
    const payloadRecord = toRecord(payload);

    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payloadRecord.data)) {
      return payloadRecord.data;
    }

    const snapshotId = toNullableString(payloadRecord.snapshot_id);
    if (snapshotId) {
      return this.awaitSnapshot(snapshotId);
    }

    if (Object.keys(payloadRecord).length > 0) {
      return [payloadRecord];
    }

    throw new TikTokProviderError({
      code: "BAD_RESPONSE",
      message: "Bright Data payload was empty",
      status: 502,
      providerPayload: payloadRecord,
    });
  }

  private async awaitSnapshot(snapshotId: string): Promise<unknown[]> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < this.asyncTimeoutMs) {
      const progressResponse = await this.fetchImpl(`https://api.brightdata.com/datasets/v3/progress/${snapshotId}`, {
        headers: {
          Authorization: `Bearer ${this.env.BRIGHTDATA_API_TOKEN}`,
        },
      });

      if (!progressResponse.ok) {
        throw this.mapHttpError(progressResponse.status, await progressResponse.text());
      }

      const progressPayload = (await progressResponse.json()) as SnapshotProgressResponse;
      const status = progressPayload.status?.toLowerCase();

      if (status === "ready") {
        const downloadResponse = await this.fetchImpl(`https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`, {
          headers: {
            Authorization: `Bearer ${this.env.BRIGHTDATA_API_TOKEN}`,
          },
        });

        if (!downloadResponse.ok) {
          throw this.mapHttpError(downloadResponse.status, await downloadResponse.text());
        }

        const snapshotPayload = (await downloadResponse.json()) as unknown;
        if (Array.isArray(snapshotPayload)) {
          return snapshotPayload;
        }

        const snapshotRecord = toRecord(snapshotPayload);
        if (Array.isArray(snapshotRecord.data)) {
          return snapshotRecord.data;
        }

        return [snapshotRecord];
      }

      if (status === "failed" || status === "error") {
        throw new TikTokProviderError({
          code: "ASYNC_COLLECTION_FAILED",
          message: "Snapshot collection failed",
          status: 502,
          retryable: true,
          providerPayload: { snapshotId, status },
        });
      }

      await sleep(this.asyncWaitMs);
    }

    throw new TikTokProviderError({
      code: "UPSTREAM_TIMEOUT",
      message: "Timed out while waiting for Bright Data snapshot",
      status: 504,
      retryable: true,
      providerPayload: { snapshotId },
    });
  }

  private mapHttpError(status: number, responseText: string): TikTokProviderError {
    const lowerText = responseText.toLowerCase();
    if (status === 404 || lowerText.includes("dead_page")) {
      return new TikTokProviderError({ code: "NOT_FOUND", message: responseText, status: 404 });
    }
    if (status === 403 || lowerText.includes("private")) {
      return new TikTokProviderError({ code: "PRIVATE_PROFILE", message: responseText, status: 403 });
    }
    if (status === 429 || lowerText.includes("rate limit")) {
      return new TikTokProviderError({ code: "RATE_LIMITED", message: responseText, status: 429, retryable: true });
    }
    if (status === 408 || status === 504 || lowerText.includes("timeout")) {
      return new TikTokProviderError({ code: "UPSTREAM_TIMEOUT", message: responseText, status: 504, retryable: true });
    }
    if (status >= 500) {
      return new TikTokProviderError({ code: "TEMPORARY_UNAVAILABLE", message: responseText, status: 503, retryable: true });
    }

    if (status === 400) {
      return new TikTokProviderError({ code: "INVALID_INPUT", message: responseText, status: 400 });
    }

    return new TikTokProviderError({
      code: "BAD_RESPONSE",
      message: responseText || "Unexpected provider response",
      status: 502,
    });
  }
}
