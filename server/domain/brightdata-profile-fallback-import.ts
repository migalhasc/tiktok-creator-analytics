import { basename } from "node:path";
import type { NormalizedPost, NormalizedProfile } from "./tiktok-types";

type ImportMode = "profile_top_posts_fallback";

type RawTopPost = {
  post_id?: string | number | null;
  post_url?: string | null;
  description?: string | null;
  hashtags?: unknown;
  create_time?: string | null;
  likes?: string | number | null;
  post_type?: string | null;
  [key: string]: unknown;
};

type RawTopVideo = {
  video_id?: string | number | null;
  video_url?: string | null;
  share_count?: string | number | null;
  playcount?: string | number | null;
  diggcount?: string | number | null;
  commentcount?: string | number | null;
  favorites_count?: string | number | null;
  create_date?: string | null;
  cover_image?: string | null;
  [key: string]: unknown;
};

type RawProfileExport = {
  timestamp?: string | null;
  input?: Record<string, unknown>;
  account_id?: string | null;
  nickname?: string | null;
  biography?: string | null;
  signature?: string | null;
  followers?: string | number | null;
  following?: string | number | null;
  likes?: string | number | null;
  like_count?: string | number | null;
  videos_count?: string | number | null;
  is_verified?: boolean | string | null;
  url?: string | null;
  profile_pic_url?: string | null;
  profile_pic_url_hd?: string | null;
  top_posts_data?: RawTopPost[] | null;
  top_videos?: RawTopVideo[] | null;
  pinned_posts?: unknown[] | null;
  [key: string]: unknown;
};

export type PostsSnapshotValidation = {
  snapshotId: string | null;
  progressStatus: string | null;
  progressRecords: number | null;
  progressErrors: number | null;
  exportedRecordCount: number;
  exportedHasUsableRecords: boolean;
  restSnapshotHasUsableRecords: boolean;
};

export type BrightDataFallbackImportBundle = {
  fetchedAt: string;
  importMode: ImportMode;
  profile: NormalizedProfile;
  posts: NormalizedPost[];
  summary: {
    username: string;
    snapshotId: string | null;
    fallbackPostsCount: number;
    officialPostsSnapshotId: string | null;
    officialPostsUsable: boolean;
  };
};

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toNullableBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }

  return null;
}

function toHashtags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item.trim().replace(/^#/, "");
        }

        const record = toRecord(item);
        return (
          toNullableString(record.hashtag_name) ??
          toNullableString(record.hashtagName) ??
          toNullableString(record.name) ??
          ""
        )
          .trim()
          .replace(/^#/, "");
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim().replace(/^#/, ""))
      .filter(Boolean);
  }

  return [];
}

function extractUsername(url: string | null, accountId: string | null): string | null {
  if (accountId) {
    return accountId.toLowerCase();
  }

  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/^\/@([A-Za-z0-9._-]+)\/?$/);
    return match?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

function extractSnapshotId(path: string): string | null {
  const match = basename(path).match(/^(sd_[^.]+)/);
  return match?.[1] ?? null;
}

function isPostLikeRecord(record: Record<string, unknown>): boolean {
  return Boolean(
    toNullableString(record.post_id) ??
      toNullableString(record.aweme_id) ??
      toNullableString(record.video_id) ??
      toNullableString(record.video_url) ??
      toNullableString(record.post_url) ??
      toNullableString(record.share_url),
  );
}

export function hasUsableOfficialPostsExport(data: unknown): boolean {
  if (!Array.isArray(data)) {
    return false;
  }

  return data.some((item) => isPostLikeRecord(toRecord(item)));
}

export function buildProfileTopPostsFallbackImport(args: {
  username: string;
  profileExportPath: string;
  postsExportPath: string;
  profileExportData: unknown;
  postsExportData: unknown;
  postsSnapshotValidation: PostsSnapshotValidation;
}): BrightDataFallbackImportBundle {
  const record = Array.isArray(args.profileExportData)
    ? (args.profileExportData[0] as RawProfileExport | undefined)
    : undefined;

  if (!record) {
    throw new Error("O export de perfil está vazio.");
  }

  if (args.postsSnapshotValidation.restSnapshotHasUsableRecords || hasUsableOfficialPostsExport(args.postsExportData)) {
    throw new Error("O snapshot oficial de posts já contém registros utilizáveis. Use a importação oficial de posts em vez do fallback.");
  }

  const profileUrl = toNullableString(record.url);
  const username = extractUsername(profileUrl, toNullableString(record.account_id));

  if (!username || username !== args.username.toLowerCase()) {
    throw new Error(`O export de perfil não corresponde a @${args.username}.`);
  }

  const fetchedAt = toNullableString(record.timestamp) ?? new Date().toISOString();
  const profileSnapshotId = extractSnapshotId(args.profileExportPath);
  const topPosts = Array.isArray(record.top_posts_data) ? record.top_posts_data : [];
  const topVideos = Array.isArray(record.top_videos) ? record.top_videos : [];
  const topVideosById = new Map<string, RawTopVideo>();

  for (const video of topVideos) {
    const id = toNullableString(video.video_id);
    if (id) {
      topVideosById.set(id, video);
    }
  }

  const posts = topPosts
    .map((post) => {
      const id = toNullableString(post.post_id);
      if (!id) {
        return null;
      }

      const topVideo = topVideosById.get(id);
      const postUrl = toNullableString(post.post_url) ?? toNullableString(topVideo?.video_url);
      if (!postUrl) {
        return null;
      }

      const normalizedPost: NormalizedPost = {
        tiktokPostId: id,
        postUrl,
        authorUsername: username,
        description: toNullableString(post.description),
        hashtags: toHashtags(post.hashtags),
        publishedAt: toNullableString(post.create_time) ?? toNullableString(topVideo?.create_date),
        likes: toNullableNumber(post.likes) ?? toNullableNumber(topVideo?.diggcount),
        comments: toNullableNumber(topVideo?.commentcount),
        shares: toNullableNumber(topVideo?.share_count),
        views: toNullableNumber(topVideo?.playcount),
        saves: toNullableNumber(topVideo?.favorites_count),
        reposts: null,
        videoUrl: toNullableString(topVideo?.video_url) ?? toNullableString(post.post_url),
        thumbnailUrl: toNullableString(topVideo?.cover_image),
        providerPayload: {
          source: "profile_export_top_posts_fallback",
          import_mode: "profile_top_posts_fallback",
          profile_snapshot_id: profileSnapshotId,
          official_posts_snapshot_id: args.postsSnapshotValidation.snapshotId,
          raw_top_post: post,
          raw_top_video: topVideo ?? null,
        },
      };

      return normalizedPost;
    })
    .filter((post): post is NormalizedPost => post !== null);

  return {
    fetchedAt,
    importMode: "profile_top_posts_fallback",
    profile: {
      username,
      profileUrl: profileUrl ?? `https://www.tiktok.com/@${username}`,
      displayName: toNullableString(record.nickname),
      biography: toNullableString(record.biography) ?? toNullableString(record.signature),
      followers: toNullableNumber(record.followers),
      following: toNullableNumber(record.following),
      likes: toNullableNumber(record.likes) ?? toNullableNumber(record.like_count),
      videosCount: toNullableNumber(record.videos_count),
      isVerified: toNullableBoolean(record.is_verified),
      avatarUrl: toNullableString(record.profile_pic_url) ?? toNullableString(record.profile_pic_url_hd),
      metricSupport: {
        likes: true,
        comments: true,
        shares: true,
        views: true,
        saves: true,
        reposts: false,
      },
      providerPayload: {
        import_mode: "profile_top_posts_fallback",
        snapshot_id: profileSnapshotId,
        source_file: args.profileExportPath,
        source_files: {
          profile: args.profileExportPath,
          posts: args.postsExportPath,
        },
        posts_snapshot_validation: args.postsSnapshotValidation,
        fallback: {
          source: "top_posts_data+top_videos",
          posts_count: posts.length,
          top_posts_count: topPosts.length,
          top_videos_count: topVideos.length,
          pinned_posts_count: Array.isArray(record.pinned_posts) ? record.pinned_posts.length : 0,
        },
        raw_profile: record,
      },
    },
    posts,
    summary: {
      username,
      snapshotId: profileSnapshotId,
      fallbackPostsCount: posts.length,
      officialPostsSnapshotId: args.postsSnapshotValidation.snapshotId,
      officialPostsUsable: args.postsSnapshotValidation.restSnapshotHasUsableRecords,
    },
  };
}

export function summarizePostsSnapshotValidation(args: {
  postsExportPath: string;
  postsExportData: unknown;
  progressResponse: Record<string, unknown>;
  restSnapshotData: unknown;
}): PostsSnapshotValidation {
  return {
    snapshotId: extractSnapshotId(args.postsExportPath),
    progressStatus: toNullableString(args.progressResponse.status),
    progressRecords: toNullableNumber(args.progressResponse.records),
    progressErrors: toNullableNumber(args.progressResponse.errors),
    exportedRecordCount: Array.isArray(args.postsExportData) ? args.postsExportData.length : 0,
    exportedHasUsableRecords: hasUsableOfficialPostsExport(args.postsExportData),
    restSnapshotHasUsableRecords: hasUsableOfficialPostsExport(args.restSnapshotData),
  };
}
