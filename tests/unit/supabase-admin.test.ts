import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn(() => ({ mocked: true }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

describe("getSupabaseAdminClient", () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockClear();
  });

  it("prefers SUPABASE_SERVER_URL when present", async () => {
    vi.doMock("../../server/env.js", () => ({
      getServerEnv: () => ({
        VITE_SUPABASE_URL: "https://public.supabase.example",
        VITE_SUPABASE_ANON_KEY: "anon-key",
        SUPABASE_SERVER_URL: "http://internal-supabase:8000",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
        BRIGHTDATA_API_TOKEN: "brightdata-token",
        BRIGHTDATA_TIKTOK_PROFILES_DATASET: "profiles-dataset",
        BRIGHTDATA_TIKTOK_POSTS_BY_PROFILE_DATASET: "posts-dataset",
        BRIGHTDATA_ASYNC_TIMEOUT_MS: 600_000,
        BRIGHTDATA_ASYNC_POLL_INTERVAL_MS: 2_000,
        CACHE_FRESHNESS_HOURS: 6,
      }),
    }));

    const { getSupabaseAdminClient } = await import("../../server/supabase-admin.ts");

    getSupabaseAdminClient();

    expect(createClientMock).toHaveBeenCalledWith("http://internal-supabase:8000", "service-role-key", {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  });

  it("falls back to the public Supabase URL when the server URL is absent", async () => {
    vi.doMock("../../server/env.js", () => ({
      getServerEnv: () => ({
        VITE_SUPABASE_URL: "https://public.supabase.example",
        VITE_SUPABASE_ANON_KEY: "anon-key",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
        BRIGHTDATA_API_TOKEN: "brightdata-token",
        BRIGHTDATA_TIKTOK_PROFILES_DATASET: "profiles-dataset",
        BRIGHTDATA_TIKTOK_POSTS_BY_PROFILE_DATASET: "posts-dataset",
        BRIGHTDATA_ASYNC_TIMEOUT_MS: 600_000,
        BRIGHTDATA_ASYNC_POLL_INTERVAL_MS: 2_000,
        CACHE_FRESHNESS_HOURS: 6,
      }),
    }));

    const { getSupabaseAdminClient } = await import("../../server/supabase-admin.ts");

    getSupabaseAdminClient();

    expect(createClientMock).toHaveBeenCalledWith("https://public.supabase.example", "service-role-key", {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  });
});
