import { describe, expect, it, vi } from "vitest";
import { TikTokRepository } from "../../server/repositories/tiktok-repository.ts";
import type { CachedProfileSnapshot, PersistSnapshotInput } from "../../server/domain/tiktok-types.ts";

function buildPersistInput(overrides?: Partial<PersistSnapshotInput>): PersistSnapshotInput {
  return {
    source: "test-refresh",
    fetchedAt: "2026-05-11T13:30:00.000Z",
    profile: {
      username: "demo",
      profileUrl: "https://www.tiktok.com/@demo",
      displayName: "Demo",
      biography: "bio",
      followers: 120,
      following: 12,
      likes: 420,
      videosCount: 9,
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
    },
    posts: [
      {
        tiktokPostId: "111",
        postUrl: "https://www.tiktok.com/@demo/video/111",
        authorUsername: "demo",
        description: "post",
        hashtags: ["analytics"],
        publishedAt: "2026-05-10T10:00:00.000Z",
        likes: 100,
        comments: 15,
        shares: 5,
        views: 1200,
        saves: null,
        reposts: null,
        videoUrl: null,
        thumbnailUrl: null,
        providerPayload: {},
      },
    ],
    ...overrides,
  };
}

function buildSnapshot(): CachedProfileSnapshot {
  return {
    profile: {
      id: "profile-1",
      username: "demo",
      profile_url: "https://www.tiktok.com/@demo",
      display_name: "Demo",
      biography: "bio",
      followers: 120,
      following: 12,
      likes: 420,
      videos_count: 9,
      is_verified: false,
      avatar_url: null,
      provider_payload: {},
      cache_status: "fresh",
      last_fetched_at: "2026-05-11T13:30:00.000Z",
      last_refresh_started_at: "2026-05-11T13:30:00.000Z",
      last_error_code: null,
      last_error_message: null,
    },
    posts: [
      {
        id: "post-1",
        profile_id: "profile-1",
        tiktok_post_id: "111",
        post_url: "https://www.tiktok.com/@demo/video/111",
        author_username: "demo",
        description: "post",
        hashtags: ["analytics"],
        published_at: "2026-05-10T10:00:00.000Z",
        likes: 100,
        comments: 15,
        shares: 5,
        views: 1200,
        saves: null,
        reposts: null,
        video_url: null,
        thumbnail_url: null,
        provider_payload: {},
        last_seen_at: "2026-05-11T13:30:00.000Z",
      },
    ],
  };
}

describe("TikTokRepository.persistSnapshot", () => {
  it("persists profile and posts without writing daily snapshots in the no-snapshots variant", async () => {
    const profileSelectSingle = vi.fn().mockResolvedValue({
      data: { id: "profile-1", username: "demo" },
      error: null,
    });
    const profileSelect = vi.fn().mockReturnValue({ single: profileSelectSingle });
    const profileUpsert = vi.fn().mockReturnValue({ select: profileSelect });
    const postsSelect = vi.fn().mockResolvedValue({
      data: [{ id: "post-1", tiktok_post_id: "111" }],
      error: null,
    });
    const postsUpsert = vi.fn().mockReturnValue({ select: postsSelect });
    const postsDeleteLt = vi.fn().mockResolvedValue({ error: null });
    const postsDeleteEq = vi.fn().mockReturnValue({ lt: postsDeleteLt });
    const postsDelete = vi.fn().mockReturnValue({ eq: postsDeleteEq });
    const fetchRunsInsert = vi.fn().mockResolvedValue({ error: null });

    const client = {
      from: vi.fn((table: string) => {
        switch (table) {
          case "profiles":
            return { upsert: profileUpsert };
          case "posts":
            return { upsert: postsUpsert, delete: postsDelete };
          case "fetch_runs":
            return { insert: fetchRunsInsert };
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      }),
    };

    const repository = new TikTokRepository(client as never);
    const expectedSnapshot = buildSnapshot();
    vi.spyOn(repository, "getProfileSnapshot").mockResolvedValue(expectedSnapshot);

    const result = await repository.persistSnapshot(buildPersistInput());

    expect(result).toBe(expectedSnapshot);
    expect(client.from).not.toHaveBeenCalledWith("profile_daily_snapshots");
    expect(client.from).not.toHaveBeenCalledWith("post_daily_snapshots");
  });

  it("still persists the profile when no posts were returned", async () => {
    const profileSelectSingle = vi.fn().mockResolvedValue({
      data: { id: "profile-1", username: "demo" },
      error: null,
    });
    const profileSelect = vi.fn().mockReturnValue({ single: profileSelectSingle });
    const profileUpsert = vi.fn().mockReturnValue({ select: profileSelect });
    const postsDeleteLt = vi.fn().mockResolvedValue({ error: null });
    const postsDeleteEq = vi.fn().mockReturnValue({ lt: postsDeleteLt });
    const postsDelete = vi.fn().mockReturnValue({ eq: postsDeleteEq });
    const fetchRunsInsert = vi.fn().mockResolvedValue({ error: null });

    const client = {
      from: vi.fn((table: string) => {
        switch (table) {
          case "profiles":
            return { upsert: profileUpsert };
          case "posts":
            return { delete: postsDelete };
          case "fetch_runs":
            return { insert: fetchRunsInsert };
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      }),
    };

    const repository = new TikTokRepository(client as never);
    vi.spyOn(repository, "getProfileSnapshot").mockResolvedValue({
      ...buildSnapshot(),
      posts: [],
    });

    await repository.persistSnapshot(
      buildPersistInput({
        posts: [],
      }),
    );

    expect(profileUpsert).toHaveBeenCalledTimes(1);
    expect(client.from).not.toHaveBeenCalledWith("post_daily_snapshots");
  });

  it("does not depend on snapshot tables being present", async () => {
    const profileSelectSingle = vi.fn().mockResolvedValue({
      data: { id: "profile-1", username: "demo" },
      error: null,
    });
    const profileSelect = vi.fn().mockReturnValue({ single: profileSelectSingle });
    const profileUpsert = vi.fn().mockReturnValue({ select: profileSelect });
    const postsSelect = vi.fn().mockResolvedValue({
      data: [{ id: "post-1", tiktok_post_id: "111" }],
      error: null,
    });
    const postsUpsert = vi.fn().mockReturnValue({ select: postsSelect });
    const postsDeleteLt = vi.fn().mockResolvedValue({ error: null });
    const postsDeleteEq = vi.fn().mockReturnValue({ lt: postsDeleteLt });
    const postsDelete = vi.fn().mockReturnValue({ eq: postsDeleteEq });
    const fetchRunsInsert = vi.fn().mockResolvedValue({ error: null });

    const client = {
      from: vi.fn((table: string) => {
        switch (table) {
          case "profiles":
            return { upsert: profileUpsert };
          case "posts":
            return { upsert: postsUpsert, delete: postsDelete };
          case "fetch_runs":
            return { insert: fetchRunsInsert };
          default:
            throw new Error(`Unexpected table: ${table}`);
        }
      }),
    };

    const repository = new TikTokRepository(client as never);
    const expectedSnapshot = buildSnapshot();
    vi.spyOn(repository, "getProfileSnapshot").mockResolvedValue(expectedSnapshot);

    const result = await repository.persistSnapshot(buildPersistInput());

    expect(result).toBe(expectedSnapshot);
    expect(client.from).not.toHaveBeenCalledWith("profile_daily_snapshots");
    expect(client.from).not.toHaveBeenCalledWith("post_daily_snapshots");
  });
});

describe("TikTokRepository history readers", () => {
  it("returns empty history when snapshot tables are not available yet", async () => {
    const profileMissingTableError = {
      code: "PGRST205",
      message: "Could not find the table 'public.profile_daily_snapshots' in the schema cache",
    };
    const postMissingTableError = {
      code: "PGRST205",
      message: "Could not find the table 'public.post_daily_snapshots' in the schema cache",
    };

    const client = {
      from: vi.fn((table: string) => {
        if (table === "profile_daily_snapshots") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  lte: vi.fn(() => ({
                    order: vi.fn().mockResolvedValue({
                      data: null,
                      error: profileMissingTableError,
                    }),
                  })),
                })),
              })),
            })),
          };
        }

        if (table === "post_daily_snapshots") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                gte: vi.fn(() => ({
                  lte: vi.fn(() => ({
                    order: vi.fn().mockResolvedValue({
                      data: null,
                      error: postMissingTableError,
                    }),
                  })),
                })),
              })),
            })),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    };

    const repository = new TikTokRepository(client as never);

    await expect(repository.getProfileDailySnapshots("profile-1", "2026-05-01", "2026-05-11")).resolves.toEqual([]);
    await expect(repository.getPostDailySnapshots(["post-1"], "2026-05-01", "2026-05-11")).resolves.toEqual([]);
  });
});
