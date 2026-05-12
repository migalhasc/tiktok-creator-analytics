import { describe, expect, it, vi } from "vitest";
import { BrightDataTikTokClient } from "../../server/domain/brightdata-client.ts";
import type { ServerEnv } from "../../server/env.ts";

const env: ServerEnv = {
  VITE_SUPABASE_URL: "https://example.supabase.co",
  VITE_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  BRIGHTDATA_API_TOKEN: "brightdata-token",
  BRIGHTDATA_TIKTOK_PROFILES_DATASET: "profiles-dataset",
  BRIGHTDATA_TIKTOK_POSTS_BY_PROFILE_DATASET: "posts-dataset",
  CACHE_FRESHNESS_HOURS: 6,
};

describe("BrightDataTikTokClient", () => {
  it("maps the current Bright Data profile response shape", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            account_id: "123456789",
            nickname: "Micael Crasto",
            biography: "Analytics creator",
            followers: 1500,
            following: 250,
            likes: 32000,
            videos_count: 95,
            is_verified: false,
            url: "https://www.tiktok.com/@micaelcrasto",
            profile_pic_url: "https://cdn.example.com/avatar.jpg",
          },
        ]),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    const client = new BrightDataTikTokClient({ env, fetchImpl });
    const profile = await client.fetchProfile("https://www.tiktok.com/@micaelcrasto");

    expect(profile).toMatchObject({
      username: "micaelcrasto",
      profileUrl: "https://www.tiktok.com/@micaelcrasto",
      displayName: "Micael Crasto",
      biography: "Analytics creator",
      followers: 1500,
      following: 250,
      likes: 32000,
      videosCount: 95,
      isVerified: false,
      avatarUrl: "https://cdn.example.com/avatar.jpg",
    });
  });

  it("maps posts by profile responses and synthesizes missing post urls", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            post_id: "7553300000000000000",
            description: "New challenge video is here #challenge #viral",
            date_posted: "2025-02-01T10:00:00.000Z",
            share_count: 95000,
            collect_count: 28000,
            comment_count: 18000,
            play_count: 42000000,
            hashtags: ["#challenge", "#viral"],
            video_url: "https://v16-webapp-prime.tiktok.com/video/example.mp4",
            profile_username: "micaelcrasto",
            profile_url: "https://www.tiktok.com/@micaelcrasto",
            is_verified: true,
          },
        ]),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    const client = new BrightDataTikTokClient({ env, fetchImpl });
    const result = await client.fetchPostsByProfile("https://www.tiktok.com/@micaelcrasto", "micaelcrasto");

    expect(result.metricSupport).toMatchObject({
      likes: true,
      comments: true,
      shares: true,
      views: true,
      saves: true,
      reposts: false,
    });
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0]).toMatchObject({
      tiktokPostId: "7553300000000000000",
      postUrl: "https://www.tiktok.com/@micaelcrasto/video/7553300000000000000",
      authorUsername: "micaelcrasto",
      description: "New challenge video is here #challenge #viral",
      hashtags: ["#challenge", "#viral"],
      publishedAt: "2025-02-01T10:00:00.000Z",
      comments: 18000,
      shares: 95000,
      views: 42000000,
      saves: 28000,
      videoUrl: "https://v16-webapp-prime.tiktok.com/video/example.mp4",
    });
  });

  it("accepts alternative public metric field names and keeps reposts aggregated in shares", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: "7553300000000000001",
            desc: "Camel case fields",
            createTime: "2025-02-01T10:00:00.000Z",
            shareCount: 67000,
            favoriteCount: 94800,
            commentCount: 1259,
            playCount: 19100000,
            diggCount: 611900,
            profile_username: "micaelcrasto",
            profile_url: "https://www.tiktok.com/@micaelcrasto",
            cover_image: "https://cdn.example.com/cover.jpg",
          },
        ]),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    const client = new BrightDataTikTokClient({ env, fetchImpl });
    const result = await client.fetchPostsByProfile("https://www.tiktok.com/@micaelcrasto", "micaelcrasto");

    expect(result.metricSupport).toMatchObject({
      shares: true,
      saves: true,
      reposts: false,
    });
    expect(result.posts[0]).toMatchObject({
      likes: 611900,
      comments: 1259,
      shares: 67000,
      saves: 94800,
      reposts: null,
      thumbnailUrl: "https://cdn.example.com/cover.jpg",
    });
  });
});
