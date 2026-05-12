import { describe, expect, it, vi } from "vitest";
import { TikTokIngestService } from "../../server/domain/ingest-service.ts";
import type { CachedProfileSnapshot, NormalizedProfile } from "../../server/domain/tiktok-types.ts";

function buildSnapshot(
  lastFetchedAt: string,
  overrides?: Partial<CachedProfileSnapshot>,
  profileOverrides?: Partial<CachedProfileSnapshot["profile"]>,
): CachedProfileSnapshot {
  return {
    profile: {
      id: "profile-1",
      username: "demo",
      profile_url: "https://www.tiktok.com/@demo",
      display_name: "Demo",
      biography: "bio",
      followers: 100,
      following: 10,
      likes: 400,
      videos_count: 8,
      is_verified: false,
      avatar_url: null,
      provider_payload: {
        metric_support: {
          likes: true,
          comments: true,
          shares: true,
          views: true,
          saves: true,
          reposts: false,
        },
      },
      cache_status: "fresh",
      last_fetched_at: lastFetchedAt,
      last_refresh_started_at: lastFetchedAt,
      last_error_code: null,
      last_error_message: null,
      ...profileOverrides,
    },
    posts: [
      {
        id: "post-1",
        profile_id: "profile-1",
        tiktok_post_id: "111",
        post_url: "https://www.tiktok.com/@demo/video/111",
        author_username: "demo",
        description: "post",
        hashtags: [],
        published_at: new Date("2026-05-01T00:00:00Z").toISOString(),
        likes: 100,
        comments: 15,
        shares: 5,
        views: 1200,
        saves: null,
        reposts: null,
        video_url: null,
        thumbnail_url: null,
        provider_payload: {},
        last_seen_at: new Date("2026-05-01T00:00:00Z").toISOString(),
      },
    ],
    ...overrides,
  };
}

function buildNormalizedProfile(): NormalizedProfile {
  return {
    username: "demo",
    profileUrl: "https://www.tiktok.com/@demo",
    displayName: "Demo",
    biography: "bio",
    followers: 100,
    following: 10,
    likes: 400,
    videosCount: 8,
    isVerified: false,
    avatarUrl: null,
    providerPayload: {},
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

describe("TikTokIngestService", () => {
  it("returns cached fresh data without marking it stale", async () => {
    const repository = {
      getProfileSnapshot: vi.fn().mockResolvedValue(buildSnapshot(new Date(Date.now() - 60_000).toISOString())),
      ensurePlaceholderSnapshot: vi.fn(),
      markProfileStale: vi.fn(),
      persistSnapshot: vi.fn(),
      markProfileError: vi.fn(),
      markProfileRefreshing: vi.fn(),
    };

    const brightDataClient = {
      fetchProfile: vi.fn(),
      fetchPostsByProfile: vi.fn(),
    };

    const service = new TikTokIngestService(repository as never, brightDataClient as never, 6);
    const dashboard = await service.searchOrGetProfileDashboard({
      profileInput: "@demo",
      source: "test",
    });

    expect(dashboard.cacheStatus).toBe("fresh");
    expect(dashboard.needsRefresh).toBe(false);
    expect(repository.markProfileStale).not.toHaveBeenCalled();
    expect(brightDataClient.fetchProfile).not.toHaveBeenCalled();
  });

  it("returns stale cached data and flags background refresh", async () => {
    const staleSnapshot = buildSnapshot(new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString());
    const repository = {
      getProfileSnapshot: vi.fn().mockResolvedValue(staleSnapshot),
      ensurePlaceholderSnapshot: vi.fn(),
      markProfileStale: vi.fn(),
      persistSnapshot: vi.fn(),
      markProfileError: vi.fn(),
      markProfileRefreshing: vi.fn(),
    };

    const brightDataClient = {
      fetchProfile: vi.fn(),
      fetchPostsByProfile: vi.fn(),
    };

    const service = new TikTokIngestService(repository as never, brightDataClient as never, 6);
    const dashboard = await service.searchOrGetProfileDashboard({
      profileInput: "demo",
      source: "test",
    });

    expect(dashboard.cacheStatus).toBe("stale");
    expect(dashboard.needsRefresh).toBe(true);
    expect(repository.markProfileStale).toHaveBeenCalledWith("demo");
  });

  it("creates a placeholder for an uncached profile and returns a refreshing dashboard immediately", async () => {
    const timestamp = new Date().toISOString();
    const placeholderSnapshot = buildSnapshot(
      timestamp,
      { posts: [] },
      {
        display_name: null,
        biography: null,
        followers: null,
        following: null,
        likes: null,
        videos_count: null,
        avatar_url: null,
        cache_status: "refreshing",
        last_fetched_at: null,
        last_refresh_started_at: null,
      },
    );
    const refreshingSnapshot = buildSnapshot(
      timestamp,
      { posts: [] },
      {
        cache_status: "refreshing",
        last_refresh_started_at: timestamp,
      },
    );

    const repository = {
      getProfileSnapshot: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(refreshingSnapshot),
      ensurePlaceholderSnapshot: vi.fn().mockResolvedValue(placeholderSnapshot),
      markProfileStale: vi.fn(),
      persistSnapshot: vi.fn(),
      markProfileError: vi.fn(),
      markProfileRefreshing: vi.fn(),
    };

    const unresolvedPosts = new Promise<never>(() => undefined);
    const brightDataClient = {
      fetchProfile: vi.fn().mockResolvedValue(buildNormalizedProfile()),
      fetchPostsByProfile: vi.fn().mockReturnValue(unresolvedPosts),
    };

    const service = new TikTokIngestService(repository as never, brightDataClient as never, 6);
    const dashboard = await service.searchOrGetProfileDashboard({
      profileInput: "@demo",
      source: "test",
    });

    expect(dashboard.cacheStatus).toBe("refreshing");
    expect(dashboard.needsRefresh).toBe(true);
    expect(dashboard.posts).toHaveLength(0);
    expect(repository.ensurePlaceholderSnapshot).toHaveBeenCalledWith({
      username: "demo",
      profileUrl: "https://www.tiktok.com/@demo",
      providerPayload: {
        created_by: "test-placeholder",
      },
    });
    expect(repository.markProfileRefreshing).toHaveBeenCalledWith("demo");
    expect(brightDataClient.fetchProfile).toHaveBeenCalledTimes(1);
    expect(brightDataClient.fetchPostsByProfile).toHaveBeenCalledTimes(1);
  });

  it("keeps a refreshing snapshot marked for automatic polling", async () => {
    const now = new Date().toISOString();
    const refreshingSnapshot = buildSnapshot(now, undefined, {
      cache_status: "refreshing",
      last_refresh_started_at: now,
    });

    const repository = {
      getProfileSnapshot: vi.fn().mockResolvedValue(refreshingSnapshot),
      ensurePlaceholderSnapshot: vi.fn(),
      markProfileStale: vi.fn(),
      persistSnapshot: vi.fn(),
      markProfileError: vi.fn(),
      markProfileRefreshing: vi.fn(),
    };

    const brightDataClient = {
      fetchProfile: vi.fn(),
      fetchPostsByProfile: vi.fn(),
    };

    const service = new TikTokIngestService(repository as never, brightDataClient as never, 6);
    const dashboard = await service.getProfileDashboard({
      username: "demo",
      range: "30d",
      sort: "best",
    });

    expect(dashboard.cacheStatus).toBe("refreshing");
    expect(dashboard.needsRefresh).toBe(true);
    expect(repository.markProfileStale).not.toHaveBeenCalled();
  });

  it("dedupes refresh requests while a recent refresh is already running", async () => {
    const now = new Date().toISOString();
    const refreshingSnapshot = buildSnapshot(now, undefined, {
      cache_status: "refreshing",
      last_refresh_started_at: now,
    });

    const repository = {
      getProfileSnapshot: vi.fn().mockResolvedValue(refreshingSnapshot),
      ensurePlaceholderSnapshot: vi.fn(),
      markProfileStale: vi.fn(),
      persistSnapshot: vi.fn(),
      markProfileError: vi.fn(),
      markProfileRefreshing: vi.fn(),
    };

    const brightDataClient = {
      fetchProfile: vi.fn(),
      fetchPostsByProfile: vi.fn(),
    };

    const service = new TikTokIngestService(repository as never, brightDataClient as never, 6);
    const dashboard = await service.refreshProfile({
      username: "demo",
      source: "test",
      force: false,
    });

    expect(dashboard.cacheStatus).toBe("refreshing");
    expect(repository.markProfileRefreshing).not.toHaveBeenCalled();
    expect(brightDataClient.fetchProfile).not.toHaveBeenCalled();
  });

  it("dedupes concurrent uncached requests before starting a second bootstrap refresh", async () => {
    const timestamp = new Date().toISOString();
    const placeholderSnapshot = buildSnapshot(
      timestamp,
      { posts: [] },
      {
        display_name: null,
        biography: null,
        followers: null,
        following: null,
        likes: null,
        videos_count: null,
        avatar_url: null,
        cache_status: "refreshing",
        last_fetched_at: null,
        last_refresh_started_at: null,
      },
    );
    const refreshingSnapshot = buildSnapshot(
      timestamp,
      { posts: [] },
      {
        cache_status: "refreshing",
        last_refresh_started_at: timestamp,
      },
    );

    const repository = {
      getProfileSnapshot: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValue(refreshingSnapshot),
      ensurePlaceholderSnapshot: vi.fn().mockResolvedValue(placeholderSnapshot),
      markProfileStale: vi.fn(),
      persistSnapshot: vi.fn(),
      markProfileError: vi.fn(),
      markProfileRefreshing: vi.fn().mockResolvedValue(undefined),
    };

    const unresolved = new Promise<never>(() => undefined);
    const brightDataClient = {
      fetchProfile: vi.fn().mockReturnValue(unresolved),
      fetchPostsByProfile: vi.fn().mockReturnValue(unresolved),
    };

    const service = new TikTokIngestService(repository as never, brightDataClient as never, 6);

    const [first, second] = await Promise.all([
      service.getProfileDashboard({ username: "demo", range: "30d", sort: "best" }),
      service.getProfileDashboard({ username: "demo", range: "30d", sort: "best" }),
    ]);

    expect(first.cacheStatus).toBe("refreshing");
    expect(second.cacheStatus).toBe("refreshing");
    expect(repository.markProfileRefreshing).toHaveBeenCalledTimes(1);
    expect(brightDataClient.fetchProfile).toHaveBeenCalledTimes(1);
    expect(brightDataClient.fetchPostsByProfile).toHaveBeenCalledTimes(1);
  });

  it("preserves the last valid snapshot when a refresh returns zero posts unexpectedly", async () => {
    const staleSnapshot = buildSnapshot(new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString());
    const repository = {
      getProfileSnapshot: vi.fn().mockResolvedValue(staleSnapshot),
      ensurePlaceholderSnapshot: vi.fn(),
      markProfileStale: vi.fn(),
      persistSnapshot: vi.fn(),
      markProfileError: vi.fn(),
      markProfileRefreshing: vi.fn().mockResolvedValue(undefined),
    };

    const brightDataClient = {
      fetchProfile: vi.fn().mockResolvedValue(buildNormalizedProfile()),
      fetchPostsByProfile: vi.fn().mockResolvedValue({
        posts: [],
        metricSupport: {
          likes: true,
          comments: true,
          shares: true,
          views: true,
          saves: true,
          reposts: false,
        },
      }),
    };

    const service = new TikTokIngestService(repository as never, brightDataClient as never, 6);

    const dashboard = await service.refreshProfile({
      username: "demo",
      source: "test",
      force: true,
    });

    expect(dashboard.cacheStatus).toBe("refreshing");
    await vi.waitFor(() => {
      expect(repository.markProfileError).toHaveBeenCalledTimes(1);
    });

    expect(repository.persistSnapshot).not.toHaveBeenCalled();
    expect(repository.markProfileError).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "demo",
        source: "test",
        profileId: "profile-1",
        errorCode: "ASYNC_COLLECTION_FAILED",
      }),
    );
  });
});
