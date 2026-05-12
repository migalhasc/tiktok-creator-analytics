import { rangeToDays, type DashboardPost, type MetricDeltaSummary, type PostTier, type SearchRange, type SortKey } from "@shared/domain";
import { calculateEngagementTotal } from "./public-metrics";
import type { PostRow } from "./tiktok-types";

function sortDescendingNullable(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return b - a;
}

function compareDatesDesc(a: string | null, b: string | null): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return new Date(b).getTime() - new Date(a).getTime();
}

export function filterPostsByRange(posts: PostRow[], range: SearchRange, now = new Date()): PostRow[] {
  const threshold = new Date(now.getTime() - rangeToDays[range] * 24 * 60 * 60 * 1000);

  return posts.filter((post) => {
    if (!post.published_at) {
      return false;
    }

    return new Date(post.published_at).getTime() >= threshold.getTime();
  });
}

export function assignTier(index: number, total: number): PostTier {
  if (total <= 1 || index === 0) return "S";

  const percentile = (index + 1) / total;
  if (percentile <= 0.2) return "S";
  if (percentile <= 0.45) return "A";
  if (percentile <= 0.75) return "B";
  return "C";
}

function emptyMetricDeltaSummary(): MetricDeltaSummary {
  return {
    startValue: null,
    endValue: null,
    delta: null,
    growthRate: null,
    previousStartValue: null,
    previousEndValue: null,
    previousDelta: null,
    deltaVsPrevious: null,
    averageDailyDelta: null,
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickPostMetric(currentValue: number | null, providerPayload: Record<string, unknown>, keys: string[]): number | null {
  if (currentValue != null) {
    return currentValue;
  }

  for (const key of keys) {
    const parsed = toNullableNumber(providerPayload[key]);
    if (parsed != null) {
      return parsed;
    }
  }

  return null;
}

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function pickPostString(currentValue: string | null, providerPayload: Record<string, unknown>, keys: string[]): string | null {
  if (currentValue) {
    return currentValue;
  }

  for (const key of keys) {
    const parsed = toNullableString(providerPayload[key]);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

export function toDashboardPosts(posts: PostRow[]): DashboardPost[] {
  return posts.map((post) => {
    const providerPayload = toRecord(post.provider_payload);
    const likes = pickPostMetric(post.likes, providerPayload, ["digg_count", "diggCount", "like_count", "likes"]);
    const comments = pickPostMetric(post.comments, providerPayload, ["comment_count", "commentCount", "comments"]);
    const shares = pickPostMetric(post.shares, providerPayload, ["share_count", "shareCount", "shares"]);
    const views = pickPostMetric(post.views, providerPayload, ["play_count", "playCount", "views"]);
    const saves = pickPostMetric(post.saves, providerPayload, [
      "collect_count",
      "collectCount",
      "save_count",
      "saveCount",
      "favorites_count",
      "favorite_count",
      "favoriteCount",
      "favorites",
      "saves",
    ]);
    const thumbnailUrl = pickPostString(post.thumbnail_url, providerPayload, [
      "cover_url",
      "coverUrl",
      "cover_image",
      "thumbnail_url",
      "thumbnailUrl",
      "origin_cover",
    ]);
    const videoUrl = pickPostString(post.video_url, providerPayload, ["video_url", "download_url"]);

    return {
      id: post.id,
      url: post.post_url,
      description: post.description,
      authorUsername: post.author_username,
      publishedAt: post.published_at,
      hashtags: post.hashtags ?? [],
      likes,
      comments,
      shares,
      views,
      saves,
      reposts: null,
      engagementTotal: calculateEngagementTotal({
        likes,
        comments,
        shares,
        saves,
        reposts: null,
      }),
      periodViews: emptyMetricDeltaSummary(),
      periodLikes: emptyMetricDeltaSummary(),
      periodComments: emptyMetricDeltaSummary(),
      periodShares: emptyMetricDeltaSummary(),
      periodSaves: emptyMetricDeltaSummary(),
      periodReposts: emptyMetricDeltaSummary(),
      rates: {
        engagementRate: null,
        shareRate: null,
        commentRate: null,
        saveRate: null,
        repostRate: null,
        engagementPer1000Views: null,
      },
      score: null,
      publishedInPeriod: false,
      grewInPeriod: false,
      evergreen: false,
      lateGrowth: false,
      tier: null,
      videoUrl,
      thumbnailUrl,
    };
  });
}

export function sortDashboardPosts(posts: DashboardPost[], sort: SortKey): DashboardPost[] {
  const sorted = [...posts];

  const metricKey =
    sort === "liked"
      ? "periodLikes"
      : sort === "viewed"
        ? "periodViews"
        : sort === "shared"
          ? "periodShares"
          : sort === "saved"
            ? "periodSaves"
            : sort === "reposted"
              ? "periodReposts"
              : sort === "commented"
                ? "periodComments"
                : null;
  const fallbackMetricKey =
    sort === "liked"
      ? "likes"
      : sort === "viewed"
        ? "views"
        : sort === "shared"
          ? "shares"
          : sort === "saved"
            ? "saves"
            : sort === "reposted"
              ? "reposts"
              : sort === "commented"
                ? "comments"
                : null;

  if (metricKey && fallbackMetricKey) {
    return sorted.sort((left, right) => {
      const leftValue = left[metricKey].delta ?? left[metricKey].endValue ?? left[fallbackMetricKey];
      const rightValue = right[metricKey].delta ?? right[metricKey].endValue ?? right[fallbackMetricKey];
      const metricDiff = sortDescendingNullable(leftValue, rightValue);
      if (metricDiff !== 0) return metricDiff;
      return compareDatesDesc(left.publishedAt, right.publishedAt);
    });
  }

  sorted.sort((left, right) => {
    const scoreDiff = sortDescendingNullable(left.score, right.score);
    if (scoreDiff !== 0) return scoreDiff;
    const engagementDiff = sortDescendingNullable(left.rates.engagementRate, right.rates.engagementRate);
    if (engagementDiff !== 0) return engagementDiff;
    return compareDatesDesc(left.publishedAt, right.publishedAt);
  });

  if (sort !== "tier") {
    return sorted;
  }

  return sorted.map((post, index, list) => ({
    ...post,
    tier: assignTier(index, list.length),
  }));
}
