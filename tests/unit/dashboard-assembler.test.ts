import { afterEach, describe, expect, it, vi } from "vitest";
import { assembleDashboard } from "../../server/domain/dashboard-assembler.ts";
import type { CachedProfileSnapshot, PostDailySnapshotRow, ProfileDailySnapshotRow } from "../../server/domain/tiktok-types.ts";

function buildProfileSnapshot(lastFetchedAt = "2026-05-11T12:00:00.000Z"): CachedProfileSnapshot {
  return {
    profile: {
      id: "profile-1",
      username: "demo",
      profile_url: "https://www.tiktok.com/@demo",
      display_name: "Demo",
      biography: "bio",
      followers: 130,
      following: 12,
      likes: 900,
      videos_count: 3,
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
    },
    posts: [
      {
        id: "post-evergreen-1",
        profile_id: "profile-1",
        tiktok_post_id: "111",
        post_url: "https://www.tiktok.com/@demo/video/111",
        author_username: "demo",
        description: "Evergreen 1",
        hashtags: ["evergreen"],
        published_at: "2026-04-01T00:00:00.000Z",
        likes: 180,
        comments: 24,
        shares: 12,
        views: 350,
        saves: null,
        reposts: null,
        video_url: null,
        thumbnail_url: null,
        provider_payload: {},
        last_seen_at: lastFetchedAt,
      },
      {
        id: "post-evergreen-2",
        profile_id: "profile-1",
        tiktok_post_id: "222",
        post_url: "https://www.tiktok.com/@demo/video/222",
        author_username: "demo",
        description: "Evergreen 2",
        hashtags: ["growth"],
        published_at: "2026-04-25T00:00:00.000Z",
        likes: 90,
        comments: 10,
        shares: 5,
        views: 130,
        saves: null,
        reposts: null,
        video_url: null,
        thumbnail_url: null,
        provider_payload: {},
        last_seen_at: lastFetchedAt,
      },
      {
        id: "post-new",
        profile_id: "profile-1",
        tiktok_post_id: "333",
        post_url: "https://www.tiktok.com/@demo/video/333",
        author_username: "demo",
        description: "Post novo",
        hashtags: ["launch"],
        published_at: "2026-05-10T00:00:00.000Z",
        likes: 50,
        comments: 4,
        shares: 2,
        views: 90,
        saves: null,
        reposts: null,
        video_url: null,
        thumbnail_url: null,
        provider_payload: {},
        last_seen_at: lastFetchedAt,
      },
    ],
  };
}

const profileHistory: ProfileDailySnapshotRow[] = [
  {
    id: "profile-snap-1",
    profile_id: "profile-1",
    snapshot_date: "2026-04-28",
    collected_at: "2026-04-28T12:00:00.000Z",
    collection_source: "test",
    followers: 80,
    following: 10,
    total_likes: 500,
    total_posts: 2,
    created_at: "2026-04-28T12:00:00.000Z",
  },
  {
    id: "profile-snap-2",
    profile_id: "profile-1",
    snapshot_date: "2026-05-04",
    collected_at: "2026-05-04T12:00:00.000Z",
    collection_source: "test",
    followers: 100,
    following: 11,
    total_likes: 650,
    total_posts: 2,
    created_at: "2026-05-04T12:00:00.000Z",
  },
  {
    id: "profile-snap-3",
    profile_id: "profile-1",
    snapshot_date: "2026-05-05",
    collected_at: "2026-05-05T12:00:00.000Z",
    collection_source: "test",
    followers: 100,
    following: 11,
    total_likes: 660,
    total_posts: 2,
    created_at: "2026-05-05T12:00:00.000Z",
  },
  {
    id: "profile-snap-4",
    profile_id: "profile-1",
    snapshot_date: "2026-05-11",
    collected_at: "2026-05-11T12:00:00.000Z",
    collection_source: "test",
    followers: 130,
    following: 12,
    total_likes: 900,
    total_posts: 3,
    created_at: "2026-05-11T12:00:00.000Z",
  },
];

const postHistory: PostDailySnapshotRow[] = [
  {
    id: "post-snap-1",
    post_id: "post-evergreen-1",
    snapshot_date: "2026-04-28",
    collected_at: "2026-04-28T12:00:00.000Z",
    collection_source: "test",
    views: 100,
    likes: 40,
    comments: 4,
    shares: 2,
    saves: null,
    reposts: null,
    created_at: "2026-04-28T12:00:00.000Z",
  },
  {
    id: "post-snap-2",
    post_id: "post-evergreen-1",
    snapshot_date: "2026-05-04",
    collected_at: "2026-05-04T12:00:00.000Z",
    collection_source: "test",
    views: 150,
    likes: 55,
    comments: 8,
    shares: 4,
    saves: null,
    reposts: null,
    created_at: "2026-05-04T12:00:00.000Z",
  },
  {
    id: "post-snap-3",
    post_id: "post-evergreen-1",
    snapshot_date: "2026-05-05",
    collected_at: "2026-05-05T12:00:00.000Z",
    collection_source: "test",
    views: 150,
    likes: 55,
    comments: 8,
    shares: 4,
    saves: null,
    reposts: null,
    created_at: "2026-05-05T12:00:00.000Z",
  },
  {
    id: "post-snap-4",
    post_id: "post-evergreen-1",
    snapshot_date: "2026-05-11",
    collected_at: "2026-05-11T12:00:00.000Z",
    collection_source: "test",
    views: 350,
    likes: 180,
    comments: 24,
    shares: 12,
    saves: null,
    reposts: null,
    created_at: "2026-05-11T12:00:00.000Z",
  },
  {
    id: "post-snap-5",
    post_id: "post-evergreen-2",
    snapshot_date: "2026-04-28",
    collected_at: "2026-04-28T12:00:00.000Z",
    collection_source: "test",
    views: 40,
    likes: 20,
    comments: 2,
    shares: 1,
    saves: null,
    reposts: null,
    created_at: "2026-04-28T12:00:00.000Z",
  },
  {
    id: "post-snap-6",
    post_id: "post-evergreen-2",
    snapshot_date: "2026-05-04",
    collected_at: "2026-05-04T12:00:00.000Z",
    collection_source: "test",
    views: 60,
    likes: 28,
    comments: 3,
    shares: 1,
    saves: null,
    reposts: null,
    created_at: "2026-05-04T12:00:00.000Z",
  },
  {
    id: "post-snap-7",
    post_id: "post-evergreen-2",
    snapshot_date: "2026-05-05",
    collected_at: "2026-05-05T12:00:00.000Z",
    collection_source: "test",
    views: 70,
    likes: 32,
    comments: 3,
    shares: 2,
    saves: null,
    reposts: null,
    created_at: "2026-05-05T12:00:00.000Z",
  },
  {
    id: "post-snap-8",
    post_id: "post-evergreen-2",
    snapshot_date: "2026-05-11",
    collected_at: "2026-05-11T12:00:00.000Z",
    collection_source: "test",
    views: 130,
    likes: 90,
    comments: 10,
    shares: 5,
    saves: null,
    reposts: null,
    created_at: "2026-05-11T12:00:00.000Z",
  },
  {
    id: "post-snap-9",
    post_id: "post-new",
    snapshot_date: "2026-05-11",
    collected_at: "2026-05-11T12:00:00.000Z",
    collection_source: "test",
    views: 90,
    likes: 50,
    comments: 4,
    shares: 2,
    saves: null,
    reposts: null,
    created_at: "2026-05-11T12:00:00.000Z",
  },
];

describe("assembleDashboard", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("separates lifetime metrics from period growth and keeps evergreen gainers", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-11T15:00:00.000Z"));

    const dashboard = assembleDashboard({
      snapshot: buildProfileSnapshot(),
      history: {
        profileDailySnapshots: profileHistory,
        postDailySnapshots: postHistory,
      },
      range: "7d",
      sort: "best",
      cacheStatus: "fresh",
      lastUpdatedAt: "2026-05-11T12:00:00.000Z",
      needsRefresh: false,
      errorMessage: null,
    });

    expect(dashboard.lifetimeAggregates.totalViews).toBe(570);
    expect(dashboard.aggregates.totalViews).toBe(260);
    expect(dashboard.profilePeriodMetrics.followers.delta).toBe(30);
    expect(dashboard.profilePeriodMetrics.followers.previousDelta).toBe(20);
    expect(dashboard.aggregates.postsGrowingInPeriod).toBe(2);
    expect(dashboard.aggregates.postsPublishedInPeriod).toBe(1);
    expect(dashboard.aggregates.evergreenPosts).toBe(2);
    expect(dashboard.posts.map((post) => post.id)).toEqual(["post-evergreen-2", "post-evergreen-1", "post-new"]);
    expect(dashboard.posts.find((post) => post.id === "post-evergreen-1")?.periodViews.delta).toBe(200);
    expect(dashboard.posts.find((post) => post.id === "post-evergreen-1")?.evergreen).toBe(true);
    expect(dashboard.posts.find((post) => post.id === "post-new")?.publishedInPeriod).toBe(true);
    expect(dashboard.diagnostics.map((diagnostic) => diagnostic.id)).toEqual(
      expect.arrayContaining(["above-average-growth", "older-posts-driving-growth"]),
    );
  });

  it("falls back safely to publish-date filtering when history is missing", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-11T15:00:00.000Z"));

    const snapshot = buildProfileSnapshot();
    const dashboard = assembleDashboard({
      snapshot,
      history: {
        profileDailySnapshots: [],
        postDailySnapshots: [],
      },
      range: "7d",
      sort: "viewed",
      cacheStatus: "fresh",
      lastUpdatedAt: "2026-05-11T12:00:00.000Z",
      needsRefresh: false,
      errorMessage: null,
    });

    expect(dashboard.posts.map((post) => post.id)).toEqual(["post-new"]);
    expect(dashboard.aggregates.totalViews).toBeNull();
    expect(dashboard.posts[0].periodViews.delta).toBeNull();
    expect(dashboard.series.every((point) => point.viewsDelta == null)).toBe(true);
    expect(dashboard.lifetimeAggregates.totalViews).toBe(570);
  });
});
