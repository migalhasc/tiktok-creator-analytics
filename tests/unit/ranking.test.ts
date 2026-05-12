import { describe, expect, it } from "vitest";
import { filterPostsByRange, sortDashboardPosts, toDashboardPosts } from "../../server/domain/ranking.ts";
import type { PostRow } from "../../server/domain/tiktok-types.ts";

const posts: PostRow[] = [
  {
    id: "1",
    profile_id: "p1",
    tiktok_post_id: "a",
    post_url: "https://www.tiktok.com/@demo/video/1",
    author_username: "demo",
    description: "A",
    hashtags: [],
    published_at: new Date("2026-05-05T00:00:00Z").toISOString(),
    likes: 150,
    comments: 10,
    shares: 4,
    views: 1_200,
    saves: null,
    reposts: null,
    video_url: null,
    thumbnail_url: null,
    provider_payload: {},
    last_seen_at: new Date("2026-05-05T00:00:00Z").toISOString(),
  },
  {
    id: "2",
    profile_id: "p1",
    tiktok_post_id: "b",
    post_url: "https://www.tiktok.com/@demo/video/2",
    author_username: "demo",
    description: "B",
    hashtags: [],
    published_at: new Date("2026-04-20T00:00:00Z").toISOString(),
    likes: 80,
    comments: 25,
    shares: 10,
    views: 4_000,
    saves: 30,
    reposts: 5,
    video_url: null,
    thumbnail_url: null,
    provider_payload: {},
    last_seen_at: new Date("2026-05-05T00:00:00Z").toISOString(),
  },
  {
    id: "3",
    profile_id: "p1",
    tiktok_post_id: "c",
    post_url: "https://www.tiktok.com/@demo/video/3",
    author_username: "demo",
    description: "C",
    hashtags: [],
    published_at: new Date("2026-01-01T00:00:00Z").toISOString(),
    likes: 400,
    comments: 30,
    shares: 12,
    views: 8_000,
    saves: 50,
    reposts: 7,
    video_url: null,
    thumbnail_url: null,
    provider_payload: {},
    last_seen_at: new Date("2026-05-05T00:00:00Z").toISOString(),
  },
];

describe("ranking helpers", () => {
  it("filters posts by the chosen time range", () => {
    const filtered = filterPostsByRange(posts, "30d", new Date("2026-05-06T00:00:00Z"));
    expect(filtered.map((post) => post.id)).toEqual(["1", "2"]);
  });

  it("sorts literal metric filters descending", () => {
    const ordered = sortDashboardPosts(toDashboardPosts(posts), "viewed");
    expect(ordered.map((post) => post.id)).toEqual(["3", "2", "1"]);
  });

  it("backfills public metrics from provider payload when legacy columns are null", () => {
    const legacyPosts = toDashboardPosts([
      {
        ...posts[0],
        likes: null,
        comments: null,
        shares: null,
        views: null,
        saves: null,
        provider_payload: {
          diggCount: 611900,
          commentCount: 1259,
          shareCount: 67000,
          playCount: 19100000,
          favoriteCount: 94800,
        },
      },
    ]);

    expect(legacyPosts[0]).toMatchObject({
      likes: 611900,
      comments: 1259,
      shares: 67000,
      views: 19100000,
      saves: 94800,
      reposts: null,
    });
  });

  it("backfills thumbnail from provider payload when legacy thumbnail column is null", () => {
    const legacyPosts = toDashboardPosts([
      {
        ...posts[0],
        thumbnail_url: null,
        provider_payload: {
          cover_image: "https://cdn.example.com/cover.jpg",
        },
      },
    ]);

    expect(legacyPosts[0].thumbnailUrl).toBe("https://cdn.example.com/cover.jpg");
  });

  it("assigns tiers when requested", () => {
    const ordered = sortDashboardPosts(toDashboardPosts(posts), "tier");
    expect(ordered[0].tier).toBe("S");
    expect(ordered[ordered.length - 1].tier).toBe("C");
  });
});
