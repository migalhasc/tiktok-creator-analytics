import { defaultRange, defaultSort, type DashboardPayload, type SearchRange, type SortKey } from "@shared/domain";
import { buildProfileUrl, normalizeProfileInput } from "@shared/profile-input";
import { BrightDataTikTokClient } from "./brightdata-client";
import { assembleDashboard } from "./dashboard-assembler";
import { TikTokProviderError, translateProviderError } from "./provider-errors";
import type { CachedProfileSnapshot, PostDailySnapshotRow, ProfileDailySnapshotRow } from "./tiktok-types";
import { TikTokRepository } from "../repositories/tiktok-repository";

const refreshDedupeMs = 90_000;
type ProfileSnapshot = Awaited<ReturnType<TikTokRepository["getProfileSnapshot"]>>;
type DashboardHistory = {
  profileDailySnapshots: ProfileDailySnapshotRow[];
  postDailySnapshots: PostDailySnapshotRow[];
};

export class TikTokIngestService {
  private readonly activeRefreshes = new Map<string, Promise<unknown>>();
  private readonly reservedRefreshes = new Set<string>();

  constructor(
    private readonly repository = new TikTokRepository(),
    private readonly brightDataClient = new BrightDataTikTokClient(),
    private readonly freshnessHours = Number(process.env.CACHE_FRESHNESS_HOURS ?? 6),
  ) {}

  async searchOrGetProfileDashboard(args: {
    profileInput: string;
    range?: SearchRange;
    sort?: SortKey;
    source: string;
  }): Promise<DashboardPayload> {
    const normalized = normalizeProfileInput(args.profileInput);
    const snapshot = await this.repository.getProfileSnapshot(normalized.username);

    if (!snapshot) {
      return this.createPlaceholderAndScheduleRefresh({
        username: normalized.username,
        profileUrl: normalized.profileUrl,
        range: args.range ?? defaultRange,
        sort: args.sort ?? defaultSort,
        source: args.source,
      });
    }

    if (snapshot.profile.cache_status === "refreshing" && this.isRecentRefresh(snapshot.profile.last_refresh_started_at)) {
      return this.buildRefreshingDashboard(snapshot, args.range ?? defaultRange, args.sort ?? defaultSort);
    }

    if (snapshot.profile.cache_status === "refreshing" && !this.isRecentRefresh(snapshot.profile.last_refresh_started_at)) {
      await this.repository.markProfileStale(normalized.username);
      const staleSnapshot = await this.repository.getProfileSnapshot(normalized.username);

      return this.buildDashboard({
        snapshot: staleSnapshot ?? snapshot,
        range: args.range ?? defaultRange,
        sort: args.sort ?? defaultSort,
        cacheStatus: "stale",
        lastUpdatedAt: snapshot.profile.last_fetched_at,
        needsRefresh: true,
        errorMessage: snapshot.profile.last_error_message,
      });
    }

    if (this.isFresh(snapshot.profile.last_fetched_at)) {
      return this.buildDashboard({
        snapshot,
        range: args.range ?? defaultRange,
        sort: args.sort ?? defaultSort,
        cacheStatus: "fresh",
        lastUpdatedAt: snapshot.profile.last_fetched_at,
        needsRefresh: false,
        errorMessage: null,
      });
    }

    await this.repository.markProfileStale(normalized.username);
    const staleSnapshot = await this.repository.getProfileSnapshot(normalized.username);

    return this.buildDashboard({
      snapshot: staleSnapshot ?? snapshot,
      range: args.range ?? defaultRange,
      sort: args.sort ?? defaultSort,
      cacheStatus: "stale",
      lastUpdatedAt: snapshot.profile.last_fetched_at,
      needsRefresh: true,
      errorMessage: snapshot.profile.last_error_message,
    });
  }

  async getProfileDashboard(args: { username: string; range?: SearchRange; sort?: SortKey }): Promise<DashboardPayload> {
    const snapshot = await this.repository.getProfileSnapshot(args.username);
    if (!snapshot) {
      return this.createPlaceholderAndScheduleRefresh({
        username: args.username.toLowerCase(),
        profileUrl: buildProfileUrl(args.username),
        range: args.range ?? defaultRange,
        sort: args.sort ?? defaultSort,
        source: "route-load",
      });
    }

    if (snapshot.profile.cache_status === "refreshing" && this.isRecentRefresh(snapshot.profile.last_refresh_started_at)) {
      return this.buildRefreshingDashboard(snapshot, args.range ?? defaultRange, args.sort ?? defaultSort);
    }

    const refreshExpired =
      snapshot.profile.cache_status === "refreshing" && !this.isRecentRefresh(snapshot.profile.last_refresh_started_at);

    if (refreshExpired || !this.isFresh(snapshot.profile.last_fetched_at)) {
      await this.repository.markProfileStale(args.username);
    }

    const refreshedSnapshot = (await this.repository.getProfileSnapshot(args.username)) ?? snapshot;
    const isFresh = this.isFresh(refreshedSnapshot.profile.last_fetched_at);
    const isRefreshing = refreshedSnapshot.profile.cache_status === "refreshing";

    return this.buildDashboard({
      snapshot: refreshedSnapshot,
      range: args.range ?? defaultRange,
      sort: args.sort ?? defaultSort,
      cacheStatus: isRefreshing ? "refreshing" : isFresh ? refreshedSnapshot.profile.cache_status : "stale",
      lastUpdatedAt: refreshedSnapshot.profile.last_fetched_at,
      needsRefresh: isRefreshing || !isFresh,
      errorMessage: refreshedSnapshot.profile.last_error_message,
    });
  }

  async refreshProfile(args: { username: string; source: string; force?: boolean }): Promise<DashboardPayload> {
    const snapshot = await this.repository.getProfileSnapshot(args.username);
    const isRefreshing =
      snapshot &&
      this.hasOngoingRefresh(args.username, snapshot.profile.cache_status, snapshot.profile.last_refresh_started_at);

    if (snapshot && isRefreshing && !args.force) {
      return this.buildRefreshingDashboard(snapshot, defaultRange, defaultSort);
    }

    if (!snapshot) {
      return this.createPlaceholderAndScheduleRefresh({
        username: args.username.toLowerCase(),
        profileUrl: buildProfileUrl(args.username),
        range: defaultRange,
        sort: defaultSort,
        source: args.source,
      });
    }

    if (!this.reserveRefreshSlot(args.username, snapshot.profile.cache_status, snapshot.profile.last_refresh_started_at)) {
      return this.buildRefreshingDashboard(snapshot, defaultRange, defaultSort);
    }

    try {
      await this.repository.markProfileRefreshing(args.username);
      const refreshingSnapshot = (await this.repository.getProfileSnapshot(args.username)) ?? snapshot;

      this.startBackgroundRefresh({
        username: args.username.toLowerCase(),
        profileUrl: refreshingSnapshot.profile.profile_url,
        source: args.source,
        fallbackSnapshot: refreshingSnapshot,
      });

      return this.buildRefreshingDashboard(refreshingSnapshot, defaultRange, defaultSort);
    } catch (error) {
      this.reservedRefreshes.delete(args.username.toLowerCase());
      throw error;
    }
  }

  private async fetchAndPersist(args: {
    username: string;
    profileUrl: string;
    range: SearchRange;
    sort: SortKey;
    source: string;
    fallbackSnapshot?: Awaited<ReturnType<TikTokRepository["getProfileSnapshot"]>>;
  }): Promise<DashboardPayload> {
    try {
      const [profile, postsResult] = await Promise.all([
        this.brightDataClient.fetchProfile(args.profileUrl),
        this.brightDataClient.fetchPostsByProfile(args.profileUrl, args.username),
      ]);

      if (this.shouldRejectEmptyPostsSnapshot(args.fallbackSnapshot, profile.videosCount, postsResult.posts.length)) {
        throw new TikTokProviderError({
          code: "ASYNC_COLLECTION_FAILED",
          message: `Bright Data returned an empty posts snapshot for @${args.username}`,
          status: 502,
          retryable: true,
          providerPayload: {
            username: args.username,
            previousPostsCount: args.fallbackSnapshot?.posts.length ?? 0,
            currentVideosCount: profile.videosCount,
          },
        });
      }

      const snapshot = await this.repository.persistSnapshot({
        fetchedAt: new Date().toISOString(),
        source: args.source,
        profile: {
          ...profile,
          metricSupport: {
            ...profile.metricSupport,
            ...postsResult.metricSupport,
          },
        },
        posts: postsResult.posts,
      });

      return this.buildDashboard({
        snapshot,
        range: args.range,
        sort: args.sort,
        cacheStatus: "fresh",
        lastUpdatedAt: snapshot.profile.last_fetched_at,
        needsRefresh: false,
        errorMessage: null,
      });
    } catch (error) {
      const translated = translateProviderError(error);
      await this.repository.markProfileError({
        username: args.username,
        source: args.source,
        profileId: args.fallbackSnapshot?.profile.id ?? null,
        errorCode: translated.code,
        errorMessage: translated.publicMessage,
        providerPayload:
          error instanceof TikTokProviderError
            ? {
                message: error.message,
                ...(error.providerPayload ?? {}),
              }
            : error instanceof Error
              ? { message: error.message }
              : {},
      });

      if (args.fallbackSnapshot) {
        return this.buildDashboard({
          snapshot: args.fallbackSnapshot,
          range: args.range,
          sort: args.sort,
          cacheStatus: "error",
          lastUpdatedAt: args.fallbackSnapshot.profile.last_fetched_at,
          needsRefresh: true,
          errorMessage: translated.publicMessage,
        });
      }

      throw error;
    }
  }

  private async createPlaceholderAndScheduleRefresh(args: {
    username: string;
    profileUrl: string;
    range: SearchRange;
    sort: SortKey;
    source: string;
  }): Promise<DashboardPayload> {
    const placeholderSnapshot = await this.repository.ensurePlaceholderSnapshot({
      username: args.username,
      profileUrl: args.profileUrl,
      providerPayload: {
        created_by: `${args.source}-placeholder`,
      },
    });

    if (!this.reserveRefreshSlot(args.username, placeholderSnapshot.profile.cache_status, placeholderSnapshot.profile.last_refresh_started_at)) {
      return this.buildRefreshingDashboard(placeholderSnapshot, args.range, args.sort);
    }

    try {
      await this.repository.markProfileRefreshing(args.username);
      const refreshingSnapshot = (await this.repository.getProfileSnapshot(args.username)) ?? placeholderSnapshot;

      this.startBackgroundRefresh({
        username: args.username,
        profileUrl: args.profileUrl,
        source: args.source,
        fallbackSnapshot: refreshingSnapshot,
      });

      return this.buildRefreshingDashboard(refreshingSnapshot, args.range, args.sort);
    } catch (error) {
      this.reservedRefreshes.delete(args.username.toLowerCase());
      throw error;
    }
  }

  private startBackgroundRefresh(args: {
    username: string;
    profileUrl: string;
    source: string;
    fallbackSnapshot: ProfileSnapshot;
  }): boolean {
    const normalizedUsername = args.username.toLowerCase();
    if (this.activeRefreshes.has(normalizedUsername)) {
      return false;
    }

    const refreshPromise = this.fetchAndPersist({
      username: args.username.toLowerCase(),
      profileUrl: args.profileUrl,
      range: defaultRange,
      sort: defaultSort,
      source: args.source,
      fallbackSnapshot: args.fallbackSnapshot,
    })
      .catch(() => undefined)
      .finally(() => {
        const active = this.activeRefreshes.get(normalizedUsername);
        if (active === refreshPromise) {
          this.activeRefreshes.delete(normalizedUsername);
        }
        this.reservedRefreshes.delete(normalizedUsername);
      });

    this.activeRefreshes.set(normalizedUsername, refreshPromise);
    this.reservedRefreshes.delete(normalizedUsername);
    return true;
  }

  private async buildRefreshingDashboard(
    snapshot: CachedProfileSnapshot,
    range: SearchRange,
    sort: SortKey,
  ): Promise<DashboardPayload> {
    return this.buildDashboard({
      snapshot,
      range,
      sort,
      cacheStatus: "refreshing",
      lastUpdatedAt: snapshot.profile.last_fetched_at,
      needsRefresh: true,
      errorMessage: snapshot.profile.last_error_message,
    });
  }

  private async buildDashboard(args: {
    snapshot: CachedProfileSnapshot;
    range: SearchRange;
    sort: SortKey;
    cacheStatus: DashboardPayload["cacheStatus"];
    lastUpdatedAt: string | null;
    needsRefresh: boolean;
    errorMessage: string | null;
  }): Promise<DashboardPayload> {
    return assembleDashboard({
      ...args,
      history: await this.loadDashboardHistory(args.snapshot, args.range),
    });
  }

  private async loadDashboardHistory(snapshot: CachedProfileSnapshot, range: SearchRange): Promise<DashboardHistory> {
    return {
      profileDailySnapshots: [],
      postDailySnapshots: [],
    };
  }

  private isFresh(lastFetchedAt: string | null): boolean {
    if (!lastFetchedAt) {
      return false;
    }

    const ageMs = Date.now() - new Date(lastFetchedAt).getTime();
    return ageMs <= this.freshnessHours * 60 * 60 * 1000;
  }

  private isRecentRefresh(lastRefreshStartedAt: string | null): boolean {
    if (!lastRefreshStartedAt) {
      return false;
    }

    return Date.now() - new Date(lastRefreshStartedAt).getTime() < refreshDedupeMs;
  }

  private hasOngoingRefresh(username: string, cacheStatus: CachedProfileSnapshot["profile"]["cache_status"], lastRefreshStartedAt: string | null): boolean {
    const normalizedUsername = username.toLowerCase();
    if (this.activeRefreshes.has(normalizedUsername) || this.reservedRefreshes.has(normalizedUsername)) {
      return true;
    }

    return cacheStatus === "refreshing" && this.isRecentRefresh(lastRefreshStartedAt);
  }

  private reserveRefreshSlot(
    username: string,
    cacheStatus: CachedProfileSnapshot["profile"]["cache_status"],
    lastRefreshStartedAt: string | null,
  ): boolean {
    const normalizedUsername = username.toLowerCase();
    if (this.hasOngoingRefresh(normalizedUsername, cacheStatus, lastRefreshStartedAt)) {
      return false;
    }

    this.reservedRefreshes.add(normalizedUsername);
    return true;
  }

  private shouldRejectEmptyPostsSnapshot(
    fallbackSnapshot: ProfileSnapshot | undefined,
    videosCount: number | null,
    postsCount: number,
  ): boolean {
    if (postsCount > 0) {
      return false;
    }

    const previousPostsCount = fallbackSnapshot?.posts.length ?? 0;
    if (previousPostsCount === 0) {
      return false;
    }

    return (videosCount ?? 0) > 0;
  }
}
