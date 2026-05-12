import { readFile } from "node:fs/promises";
import { getServerEnv } from "../env";
import {
  buildProfileTopPostsFallbackImport,
  summarizePostsSnapshotValidation,
} from "../domain/brightdata-profile-fallback-import";
import { TikTokRepository } from "../repositories/tiktok-repository";

type Args = {
  username: string;
  profileExportPath: string;
  postsExportPath: string;
  mode: "profile_top_posts_fallback";
};

function parseArgs(argv: string[]): Args {
  const values = new Map<string, string>();

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith("--")) continue;

    const [key, inlineValue] = current.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      values.set(key, inlineValue);
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      values.set(key, next);
      index += 1;
    } else {
      values.set(key, "true");
    }
  }

  return {
    username: values.get("username") ?? "careca_soso",
    profileExportPath:
      values.get("profile-export-path") ?? "/Users/miguelcrasto/Downloads/sd_movtgzuejctbfj71k.success.json",
    postsExportPath:
      values.get("posts-export-path") ?? "/Users/miguelcrasto/Downloads/sd_movth0nu1pxtc3zqwb.success.json",
    mode: "profile_top_posts_fallback",
  };
}

async function readJsonFile(path: string): Promise<unknown> {
  const content = await readFile(path, "utf8");
  return JSON.parse(content);
}

function inferSnapshotId(path: string): string | null {
  const match = path.match(/(sd_[^.\/]+)/);
  return match?.[1] ?? null;
}

async function fetchBrightDataJson(url: string, token: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Bright Data request failed (${response.status}) for ${url}`);
  }

  return (await response.json()) as unknown;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = getServerEnv();
  const repository = new TikTokRepository();

  const profileExportData = await readJsonFile(args.profileExportPath);
  const postsExportData = await readJsonFile(args.postsExportPath);
  const postsSnapshotId = inferSnapshotId(args.postsExportPath);

  if (!postsSnapshotId) {
    throw new Error("Não foi possível inferir o snapshot ID do arquivo de posts.");
  }

  const progressResponse = (await fetchBrightDataJson(
    `https://api.brightdata.com/datasets/v3/progress/${postsSnapshotId}`,
    env.BRIGHTDATA_API_TOKEN,
  )) as Record<string, unknown>;

  const restSnapshotData = await fetchBrightDataJson(
    `https://api.brightdata.com/datasets/v3/snapshot/${postsSnapshotId}?format=json`,
    env.BRIGHTDATA_API_TOKEN,
  );

  const postsSnapshotValidation = summarizePostsSnapshotValidation({
    postsExportPath: args.postsExportPath,
    postsExportData,
    progressResponse,
    restSnapshotData,
  });

  const bundle = buildProfileTopPostsFallbackImport({
    username: args.username,
    profileExportPath: args.profileExportPath,
    postsExportPath: args.postsExportPath,
    profileExportData,
    postsExportData,
    postsSnapshotValidation,
  });

  const before = await repository.getProfileSnapshot(args.username);
  const persisted = await repository.persistSnapshot({
    source: "manual-import-profile-export-top-posts-fallback",
    fetchedAt: bundle.fetchedAt,
    profile: bundle.profile,
    posts: bundle.posts,
  });
  await repository.markProfileRefreshing(args.username);
  const after = await repository.getProfileSnapshot(args.username);

  const within30d = (after?.posts ?? []).filter((post) => {
    if (!post.published_at) return false;
    const publishedAt = new Date(post.published_at).getTime();
    return publishedAt >= Date.now() - 30 * 24 * 60 * 60 * 1000;
  }).length;

  console.log(
    JSON.stringify(
      {
        mode: args.mode,
        validatedOfficialPostsSnapshot: postsSnapshotValidation,
        before: {
          profileId: before?.profile.id ?? null,
          cacheStatus: before?.profile.cache_status ?? null,
          postsCount: before?.posts.length ?? 0,
          lastErrorMessage: before?.profile.last_error_message ?? null,
        },
        imported: {
          profileUsername: persisted.profile.username,
          fetchedAt: bundle.fetchedAt,
          fallbackPostsCount: bundle.posts.length,
        },
        after: {
          cacheStatus: after?.profile.cache_status ?? null,
          lastFetchedAt: after?.profile.last_fetched_at ?? null,
          lastRefreshStartedAt: after?.profile.last_refresh_started_at ?? null,
          lastErrorMessage: after?.profile.last_error_message ?? null,
          postsCount: after?.posts.length ?? 0,
          postsWithin30d: within30d,
        },
      },
      null,
      2,
    ),
  );
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
