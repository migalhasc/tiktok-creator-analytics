import { describe, expect, it } from "vitest";
import {
  buildProfileTopPostsFallbackImport,
  hasUsableOfficialPostsExport,
  summarizePostsSnapshotValidation,
} from "../../server/domain/brightdata-profile-fallback-import.ts";

describe("brightdata profile fallback import", () => {
  it("detects that an official posts export with only input metadata is not usable", () => {
    expect(
      hasUsableOfficialPostsExport([
        {
          timestamp: "2026-05-07T18:42:18.490Z",
          input: {
            url: "https://www.tiktok.com/@careca_soso",
          },
        },
      ]),
    ).toBe(false);
  });

  it("builds merged fallback posts from top_posts_data and top_videos", () => {
    const profileExportData = [
      {
        timestamp: "2026-05-07T18:25:39.000Z",
        account_id: "careca_soso",
        nickname: "Careca",
        biography: "bio",
        followers: 1000,
        following: 10,
        likes: 50000,
        videos_count: 120,
        is_verified: false,
        url: "https://www.tiktok.com/@careca_soso",
        profile_pic_url: "https://example.com/avatar.jpg",
        top_posts_data: [
          {
            post_id: "1",
            post_url: "https://www.tiktok.com/@careca_soso/video/1",
            description: "Primeiro post",
            hashtags: ["#viral"],
            create_time: "2026-05-07T15:00:00.000Z",
            likes: 150,
          },
          {
            post_id: "2",
            post_url: "https://www.tiktok.com/@careca_soso/video/2",
            description: null,
            hashtags: null,
            create_time: "2026-05-06T15:00:00.000Z",
            likes: 90,
          },
        ],
        top_videos: [
          {
            video_id: "1",
            video_url: "https://www.tiktok.com/@careca_soso/video/1",
            share_count: 11,
            playcount: 900,
            diggcount: 160,
            commentcount: 4,
            favorites_count: 3,
            create_date: "2026-05-07T15:00:00.000Z",
            cover_image: "https://example.com/1.jpg",
          },
          {
            video_id: "2",
            video_url: "https://www.tiktok.com/@careca_soso/video/2",
            share_count: 6,
            playcount: 600,
            diggcount: 95,
            commentcount: 2,
            favorites_count: 1,
            create_date: "2026-05-06T15:00:00.000Z",
            cover_image: "https://example.com/2.jpg",
          },
        ],
        pinned_posts: [],
      },
    ];

    const postsExportData = [
      {
        timestamp: "2026-05-07T18:42:18.490Z",
        input: {
          url: "https://www.tiktok.com/@careca_soso",
        },
      },
    ];

    const validation = summarizePostsSnapshotValidation({
      postsExportPath: "/tmp/sd_movth0nu1pxtc3zqwb.success.json",
      postsExportData,
      progressResponse: {
        status: "ready",
        records: 0,
        errors: 0,
      },
      restSnapshotData: postsExportData,
    });

    const bundle = buildProfileTopPostsFallbackImport({
      username: "careca_soso",
      profileExportPath: "/tmp/sd_movtgzuejctbfj71k.success.json",
      postsExportPath: "/tmp/sd_movth0nu1pxtc3zqwb.success.json",
      profileExportData,
      postsExportData,
      postsSnapshotValidation: validation,
    });

    expect(bundle.profile.username).toBe("careca_soso");
    expect(bundle.profile.metricSupport.saves).toBe(true);
    expect(bundle.posts).toHaveLength(2);
    expect(bundle.posts[0]).toMatchObject({
      tiktokPostId: "1",
      likes: 150,
      comments: 4,
      shares: 11,
      views: 900,
      saves: 3,
      reposts: null,
    });
    expect(bundle.posts[0].hashtags).toEqual(["viral"]);
    expect(bundle.summary.officialPostsUsable).toBe(false);
  });
});
