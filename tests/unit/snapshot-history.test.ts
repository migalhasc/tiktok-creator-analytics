import { describe, expect, it } from "vitest";
import {
  buildPeriodBoundaries,
  buildPostSnapshotBoundarySets,
  buildSnapshotBoundarySet,
  hasEnoughHistory,
} from "../../server/domain/snapshot-history.ts";
import type { PostDailySnapshotRow, ProfileDailySnapshotRow } from "../../server/domain/tiktok-types.ts";

const profileSnapshots: ProfileDailySnapshotRow[] = [
  {
    id: "profile-snap-1",
    profile_id: "profile-1",
    snapshot_date: "2026-05-01",
    collected_at: "2026-05-01T12:00:00.000Z",
    collection_source: "test",
    followers: 100,
    following: 10,
    total_likes: 400,
    total_posts: 8,
    created_at: "2026-05-01T12:00:00.000Z",
  },
  {
    id: "profile-snap-2",
    profile_id: "profile-1",
    snapshot_date: "2026-05-05",
    collected_at: "2026-05-05T12:00:00.000Z",
    collection_source: "test",
    followers: 120,
    following: 11,
    total_likes: 430,
    total_posts: 9,
    created_at: "2026-05-05T12:00:00.000Z",
  },
  {
    id: "profile-snap-3",
    profile_id: "profile-1",
    snapshot_date: "2026-05-11",
    collected_at: "2026-05-11T12:00:00.000Z",
    collection_source: "test",
    followers: 160,
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
    id: "post-snap-2",
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
    id: "post-snap-3",
    post_id: "post-2",
    snapshot_date: "2026-05-04",
    collected_at: "2026-05-04T12:00:00.000Z",
    collection_source: "test",
    views: 400,
    likes: 40,
    comments: 4,
    shares: 2,
    saves: 1,
    reposts: null,
    created_at: "2026-05-04T12:00:00.000Z",
  },
  {
    id: "post-snap-4",
    post_id: "post-2",
    snapshot_date: "2026-05-11",
    collected_at: "2026-05-11T12:00:00.000Z",
    collection_source: "test",
    views: 700,
    likes: 60,
    comments: 7,
    shares: 3,
    saves: 2,
    reposts: null,
    created_at: "2026-05-11T12:00:00.000Z",
  },
];

describe("snapshot-history helpers", () => {
  it("builds current and previous period boundaries from the selected range", () => {
    expect(buildPeriodBoundaries("7d", new Date("2026-05-11T15:00:00.000Z"))).toEqual({
      currentStartDate: "2026-05-05",
      currentEndDate: "2026-05-11",
      previousStartDate: "2026-04-28",
      previousEndDate: "2026-05-04",
    });
  });

  it("selects the closest available profile snapshots at each boundary", () => {
    const boundaries = buildPeriodBoundaries("7d", new Date("2026-05-11T15:00:00.000Z"));
    const boundarySet = buildSnapshotBoundarySet(profileSnapshots, boundaries);

    expect(boundarySet.currentStart?.snapshot_date).toBe("2026-05-05");
    expect(boundarySet.currentEnd?.snapshot_date).toBe("2026-05-11");
    expect(boundarySet.previousStart).toBeNull();
    expect(boundarySet.previousEnd?.snapshot_date).toBe("2026-05-01");
    expect(hasEnoughHistory(boundarySet)).toBe(true);
  });

  it("builds per-post boundary sets from grouped post snapshots", () => {
    const boundaries = buildPeriodBoundaries("7d", new Date("2026-05-11T15:00:00.000Z"));
    const boundarySets = buildPostSnapshotBoundarySets(postSnapshots, boundaries);

    expect(boundarySets).toHaveLength(2);
    expect(boundarySets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          postId: "post-1",
          currentStart: expect.objectContaining({ snapshot_date: "2026-05-05" }),
          currentEnd: expect.objectContaining({ snapshot_date: "2026-05-11" }),
        }),
        expect.objectContaining({
          postId: "post-2",
          currentStart: expect.objectContaining({ snapshot_date: "2026-05-04" }),
          currentEnd: expect.objectContaining({ snapshot_date: "2026-05-11" }),
        }),
      ]),
    );
  });
});
