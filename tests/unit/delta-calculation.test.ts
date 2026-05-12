import { describe, expect, it } from "vitest";
import { calculatePostPeriodMetrics, calculateProfilePeriodMetrics } from "../../server/domain/delta-calculation.ts";
import { buildPeriodBoundaries, buildPostSnapshotBoundarySets, buildSnapshotBoundarySet } from "../../server/domain/snapshot-history.ts";
import type { PostDailySnapshotRow, ProfileDailySnapshotRow } from "../../server/domain/tiktok-types.ts";

const profileSnapshots: ProfileDailySnapshotRow[] = [
  {
    id: "profile-snap-1",
    profile_id: "profile-1",
    snapshot_date: "2026-04-28",
    collected_at: "2026-04-28T12:00:00.000Z",
    collection_source: "test",
    followers: 80,
    following: 10,
    total_likes: 300,
    total_posts: 7,
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
    total_likes: 400,
    total_posts: 8,
    created_at: "2026-05-04T12:00:00.000Z",
  },
  {
    id: "profile-snap-3",
    profile_id: "profile-1",
    snapshot_date: "2026-05-05",
    collected_at: "2026-05-05T12:00:00.000Z",
    collection_source: "test",
    followers: 105,
    following: 11,
    total_likes: 410,
    total_posts: 8,
    created_at: "2026-05-05T12:00:00.000Z",
  },
  {
    id: "profile-snap-4",
    profile_id: "profile-1",
    snapshot_date: "2026-05-11",
    collected_at: "2026-05-11T12:00:00.000Z",
    collection_source: "test",
    followers: 140,
    following: 12,
    total_likes: 500,
    total_posts: 10,
    created_at: "2026-05-11T12:00:00.000Z",
  },
];

const postSnapshots: PostDailySnapshotRow[] = [
  {
    id: "post-snap-1",
    post_id: "post-1",
    snapshot_date: "2026-04-28",
    collected_at: "2026-04-28T12:00:00.000Z",
    collection_source: "test",
    views: 600,
    likes: 60,
    comments: 6,
    shares: 3,
    saves: null,
    reposts: null,
    created_at: "2026-04-28T12:00:00.000Z",
  },
  {
    id: "post-snap-2",
    post_id: "post-1",
    snapshot_date: "2026-05-04",
    collected_at: "2026-05-04T12:00:00.000Z",
    collection_source: "test",
    views: 900,
    likes: 90,
    comments: 9,
    shares: 4,
    saves: null,
    reposts: null,
    created_at: "2026-05-04T12:00:00.000Z",
  },
  {
    id: "post-snap-3",
    post_id: "post-1",
    snapshot_date: "2026-05-05",
    collected_at: "2026-05-05T12:00:00.000Z",
    collection_source: "test",
    views: 1000,
    likes: 100,
    comments: 10,
    shares: 5,
    saves: null,
    reposts: null,
    created_at: "2026-05-05T12:00:00.000Z",
  },
  {
    id: "post-snap-4",
    post_id: "post-1",
    snapshot_date: "2026-05-11",
    collected_at: "2026-05-11T12:00:00.000Z",
    collection_source: "test",
    views: 1800,
    likes: 150,
    comments: 25,
    shares: 9,
    saves: null,
    reposts: null,
    created_at: "2026-05-11T12:00:00.000Z",
  },
  {
    id: "post-snap-5",
    post_id: "post-2",
    snapshot_date: "2026-05-05",
    collected_at: "2026-05-05T12:00:00.000Z",
    collection_source: "test",
    views: 400,
    likes: 40,
    comments: 4,
    shares: 2,
    saves: null,
    reposts: null,
    created_at: "2026-05-05T12:00:00.000Z",
  },
  {
    id: "post-snap-6",
    post_id: "post-2",
    snapshot_date: "2026-05-11",
    collected_at: "2026-05-11T12:00:00.000Z",
    collection_source: "test",
    views: 900,
    likes: 90,
    comments: 12,
    shares: 4,
    saves: null,
    reposts: null,
    created_at: "2026-05-11T12:00:00.000Z",
  },
];

describe("delta-calculation", () => {
  it("calculates follower growth and comparison between periods", () => {
    const boundaries = buildPeriodBoundaries("7d", new Date("2026-05-11T15:00:00.000Z"));
    const boundarySet = buildSnapshotBoundarySet(profileSnapshots, boundaries);
    const metrics = calculateProfilePeriodMetrics(boundarySet, "7d");

    expect(metrics.followers.delta).toBe(35);
    expect(metrics.followers.previousDelta).toBe(20);
    expect(metrics.followers.deltaVsPrevious).toBe(15);
    expect(metrics.followers.averageDailyDelta).toBe(5);
  });

  it("calculates views earned during the selected period for each post", () => {
    const boundaries = buildPeriodBoundaries("7d", new Date("2026-05-11T15:00:00.000Z"));
    const boundarySets = buildPostSnapshotBoundarySets(postSnapshots, boundaries);
    const metrics = calculatePostPeriodMetrics(boundarySets, "7d");

    expect(metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          postId: "post-1",
          views: expect.objectContaining({
            startValue: 1000,
            endValue: 1800,
            delta: 800,
          }),
        }),
        expect.objectContaining({
          postId: "post-2",
          views: expect.objectContaining({
            startValue: 400,
            endValue: 900,
            delta: 500,
          }),
        }),
      ]),
    );
  });

  it("keeps unavailable saves and reposts as unavailable instead of false zero", () => {
    const boundaries = buildPeriodBoundaries("7d", new Date("2026-05-11T15:00:00.000Z"));
    const boundarySets = buildPostSnapshotBoundarySets(postSnapshots, boundaries);
    const [firstPost] = calculatePostPeriodMetrics(boundarySets, "7d");

    expect(firstPost.saves.delta).toBeNull();
    expect(firstPost.reposts.delta).toBeNull();
  });
});
