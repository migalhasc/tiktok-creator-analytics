import type { CacheStatus, DashboardPayload, FilterAvailabilityMap, SearchRange, SortKey } from "@shared/domain";

export type MetricSupport = {
  likes: boolean;
  comments: boolean;
  shares: boolean;
  views: boolean;
  saves: boolean;
  reposts: boolean;
};

export type NormalizedProfile = {
  username: string;
  profileUrl: string;
  displayName: string | null;
  biography: string | null;
  followers: number | null;
  following: number | null;
  likes: number | null;
  videosCount: number | null;
  isVerified: boolean | null;
  avatarUrl: string | null;
  providerPayload: Record<string, unknown>;
  metricSupport: MetricSupport;
};

export type NormalizedPost = {
  tiktokPostId: string;
  postUrl: string;
  authorUsername: string;
  description: string | null;
  hashtags: string[];
  publishedAt: string | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  views: number | null;
  saves: number | null;
  reposts: number | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  providerPayload: Record<string, unknown>;
};

export type ProfileRow = {
  id: string;
  username: string;
  profile_url: string;
  display_name: string | null;
  biography: string | null;
  followers: number | null;
  following: number | null;
  likes: number | null;
  videos_count: number | null;
  is_verified: boolean | null;
  avatar_url: string | null;
  provider_payload: Record<string, unknown>;
  cache_status: CacheStatus;
  last_fetched_at: string | null;
  last_refresh_started_at: string | null;
  last_error_code: string | null;
  last_error_message: string | null;
};

export type PostRow = {
  id: string;
  profile_id: string;
  tiktok_post_id: string;
  post_url: string;
  author_username: string;
  description: string | null;
  hashtags: string[];
  published_at: string | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  views: number | null;
  saves: number | null;
  reposts: number | null;
  video_url: string | null;
  thumbnail_url: string | null;
  provider_payload: Record<string, unknown>;
  last_seen_at: string;
};

export type ProfileDailySnapshotRow = {
  id: string;
  profile_id: string;
  snapshot_date: string;
  collected_at: string;
  collection_source: string;
  followers: number | null;
  following: number | null;
  total_likes: number | null;
  total_posts: number | null;
  created_at: string;
};

export type PostDailySnapshotRow = {
  id: string;
  post_id: string;
  snapshot_date: string;
  collected_at: string;
  collection_source: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  reposts: number | null;
  created_at: string;
};

export type CachedProfileSnapshot = {
  profile: ProfileRow;
  posts: PostRow[];
};

export type PersistSnapshotInput = {
  source: string;
  fetchedAt: string;
  profile: NormalizedProfile;
  posts: NormalizedPost[];
};

export type FetchFailureInput = {
  username: string;
  source: string;
  errorCode: string;
  errorMessage: string;
  providerPayload?: Record<string, unknown>;
  profileId?: string | null;
};

export type PlaceholderProfileInput = {
  username: string;
  profileUrl: string;
  providerPayload?: Record<string, unknown>;
};

export type DashboardContext = {
  range: SearchRange;
  sort: SortKey;
  cacheStatus: CacheStatus;
  lastUpdatedAt: string | null;
  needsRefresh: boolean;
  errorMessage: string | null;
  filterAvailability: FilterAvailabilityMap;
};

export type DashboardBuildResult = DashboardPayload;
