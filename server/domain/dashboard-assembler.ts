import type {
  DashboardAggregates,
  DashboardLifetimeAggregates,
  DashboardPayload,
  DashboardPost,
  DashboardSeriesPoint,
  MetricDeltaSummary,
  SearchRange,
  SortKey,
} from "@shared/domain";
import { buildDiagnostics } from "./diagnostics";
import { calculatePostPeriodMetrics, calculateProfilePeriodMetrics, type PostPeriodMetrics } from "./delta-calculation";
import { sumNullable } from "./engagement";
import { buildFilterAvailability } from "./filter-availability";
import {
  buildRankablePostMetrics,
  calculateNormalizedScores,
  type RankablePostMetrics,
} from "./normalized-ranking";
import { classifyPostGrowth } from "./post-growth";
import {
  calculateCommentRate,
  calculateEngagementPerThousandViews,
  calculateEngagementRate,
  calculateEngagementTotal,
  calculateRepostRate,
  calculateSaveRate,
  calculateShareRate,
} from "./public-metrics";
import { filterPostsByRange, sortDashboardPosts, toDashboardPosts } from "./ranking";
import {
  buildPeriodBoundaries,
  buildPostSnapshotBoundarySets,
  buildSnapshotBoundarySet,
  pickClosestSnapshotAtOrBefore,
} from "./snapshot-history";
import type { CachedProfileSnapshot, PostDailySnapshotRow, ProfileDailySnapshotRow } from "./tiktok-types";

type DashboardHistory = {
  profileDailySnapshots: ProfileDailySnapshotRow[];
  postDailySnapshots: PostDailySnapshotRow[];
};

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

function buildLifetimeAggregates(posts: DashboardPost[]): DashboardLifetimeAggregates {
  const totalViews = sumNullable(posts.map((post) => post.views));
  const totalLikes = sumNullable(posts.map((post) => post.likes));
  const totalComments = sumNullable(posts.map((post) => post.comments));
  const totalShares = sumNullable(posts.map((post) => post.shares));
  const totalSaves = sumNullable(posts.map((post) => post.saves));
  const totalReposts = sumNullable(posts.map((post) => post.reposts));
  const totalEngagement = sumNullable(posts.map((post) => calculateEngagementTotal(post)));

  return {
    postsCount: posts.length,
    totalViews,
    totalLikes,
    totalComments,
    totalShares,
    totalSaves,
    totalReposts,
    totalEngagement,
  };
}

function buildPeriodAggregates(posts: DashboardPost[], followers: number | null): DashboardAggregates {
  const totalViews = sumNullable(posts.map((post) => post.periodViews.delta));
  const totalLikes = sumNullable(posts.map((post) => post.periodLikes.delta));
  const totalComments = sumNullable(posts.map((post) => post.periodComments.delta));
  const totalShares = sumNullable(posts.map((post) => post.periodShares.delta));
  const totalSaves = sumNullable(posts.map((post) => post.periodSaves.delta));
  const totalReposts = sumNullable(posts.map((post) => post.periodReposts.delta));
  const totalEngagement = sumNullable(
    posts.map((post) =>
      calculateEngagementTotal({
        likes: post.periodLikes.delta,
        comments: post.periodComments.delta,
        shares: post.periodShares.delta,
        saves: post.periodSaves.delta,
        reposts: post.periodReposts.delta,
      }),
    ),
  );

  return {
    postsCount: posts.length,
    totalViews,
    totalLikes,
    totalComments,
    totalShares,
    totalSaves,
    totalReposts,
    totalEngagement,
    engagementRateByViews: calculateEngagementRate({
      views: totalViews,
      likes: totalLikes,
      comments: totalComments,
      shares: totalShares,
      saves: totalSaves,
      reposts: totalReposts,
    }),
    engagementRateByFollowers:
      followers != null && totalEngagement != null && followers > 0 ? (totalEngagement / followers) * 100 : null,
    shareRate: calculateShareRate({
      views: totalViews,
      shares: totalShares,
    }),
    commentRate: calculateCommentRate({
      views: totalViews,
      comments: totalComments,
    }),
    saveRate: calculateSaveRate({
      views: totalViews,
      saves: totalSaves,
    }),
    repostRate: calculateRepostRate({
      views: totalViews,
      reposts: totalReposts,
    }),
    engagementPer1000Views: calculateEngagementPerThousandViews({
      views: totalViews,
      likes: totalLikes,
      comments: totalComments,
      shares: totalShares,
      saves: totalSaves,
      reposts: totalReposts,
    }),
    postsPublishedInPeriod: posts.filter((post) => post.publishedInPeriod).length,
    postsGrowingInPeriod: posts.filter((post) => post.grewInPeriod).length,
    evergreenPosts: posts.filter((post) => post.evergreen).length,
  };
}

function formatSeriesLabel(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function enumerateSnapshotDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  while (cursor.getTime() <= end.getTime()) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

function buildViewsDeltaSeries(posts: DashboardPost[], snapshots: PostDailySnapshotRow[], range: SearchRange): DashboardSeriesPoint[] {
  const boundaries = buildPeriodBoundaries(range);
  const snapshotsByPostId = new Map<string, PostDailySnapshotRow[]>();

  for (const snapshot of snapshots) {
    const rows = snapshotsByPostId.get(snapshot.post_id) ?? [];
    rows.push(snapshot);
    snapshotsByPostId.set(snapshot.post_id, rows);
  }

  for (const rows of Array.from(snapshotsByPostId.values())) {
    rows.sort((left, right) => left.snapshot_date.localeCompare(right.snapshot_date));
  }

  const totalViewsAt = (date: string): number | null => {
    const values = posts
      .map((post) => pickClosestSnapshotAtOrBefore(snapshotsByPostId.get(post.id) ?? [], date)?.views ?? null)
      .filter((value): value is number => typeof value === "number");

    if (values.length === 0) {
      return null;
    }

    return values.reduce((sum, value) => sum + value, 0);
  };

  let previousCumulativeViews = totalViewsAt(boundaries.previousEndDate);

  return enumerateSnapshotDates(boundaries.currentStartDate, boundaries.currentEndDate).map((date) => {
    const cumulativeViews = totalViewsAt(date);
    const viewsDelta =
      cumulativeViews != null && previousCumulativeViews != null ? cumulativeViews - previousCumulativeViews : null;

    if (cumulativeViews != null) {
      previousCumulativeViews = cumulativeViews;
    }

    return {
      date,
      label: formatSeriesLabel(date),
      viewsDelta,
    };
  });
}

function buildRateRows(periodMetrics: PostPeriodMetrics[]): Array<RankablePostMetrics & { postId: string }> {
  return periodMetrics.map((metrics) => ({
    postId: metrics.postId,
    engagementRate: calculateEngagementRate({
      views: metrics.views.delta,
      likes: metrics.likes.delta,
      comments: metrics.comments.delta,
      shares: metrics.shares.delta,
      saves: metrics.saves.delta,
      reposts: metrics.reposts.delta,
    }),
    shareRate: calculateShareRate({
      views: metrics.views.delta,
      shares: metrics.shares.delta,
    }),
    commentRate: calculateCommentRate({
      views: metrics.views.delta,
      comments: metrics.comments.delta,
    }),
    saveRate: calculateSaveRate({
      views: metrics.views.delta,
      saves: metrics.saves.delta,
    }),
    repostRate: calculateRepostRate({
      views: metrics.views.delta,
      reposts: metrics.reposts.delta,
    }),
    engagementPerThousandViews: calculateEngagementPerThousandViews({
      views: metrics.views.delta,
      likes: metrics.likes.delta,
      comments: metrics.comments.delta,
      shares: metrics.shares.delta,
      saves: metrics.saves.delta,
      reposts: metrics.reposts.delta,
    }),
    viewsDelta: metrics.views.delta,
    viewsDeltaVsPrevious: metrics.views.deltaVsPrevious,
  }));
}

function buildEnrichedPosts(args: {
  snapshot: CachedProfileSnapshot;
  range: SearchRange;
  history: DashboardHistory;
}): DashboardPost[] {
  const boundaries = buildPeriodBoundaries(args.range);
  const basePosts = toDashboardPosts(args.snapshot.posts);
  const postBoundarySets = buildPostSnapshotBoundarySets(args.history.postDailySnapshots, boundaries);
  const postPeriodMetrics = calculatePostPeriodMetrics(postBoundarySets, args.range);
  const classifications = classifyPostGrowth(
    basePosts.map((post) => ({
      id: post.id,
      publishedAt: post.publishedAt,
    })),
    postPeriodMetrics,
    boundaries,
  );
  const rateRows = buildRateRows(postPeriodMetrics);
  const rankableMetrics = buildRankablePostMetrics(postPeriodMetrics, rateRows);
  const scores = calculateNormalizedScores(rankableMetrics);

  const metricsByPostId = new Map(postPeriodMetrics.map((metrics) => [metrics.postId, metrics]));
  const classificationByPostId = new Map(classifications.map((classification) => [classification.postId, classification]));
  const ratesByPostId = new Map(rateRows.map((rates) => [rates.postId, rates]));
  const scoresByPostId = new Map(scores.map((score) => [score.postId, score.score]));

  const hasHistory = postPeriodMetrics.some((metrics) => metrics.views.delta != null);
  const fallbackPosts = new Set(filterPostsByRange(args.snapshot.posts, args.range).map((post) => post.id));

  return basePosts
    .map((post) => {
      const metrics = metricsByPostId.get(post.id);
      const classification = classificationByPostId.get(post.id);
      const rates = ratesByPostId.get(post.id);

      return {
        ...post,
        periodViews: metrics?.views ?? emptyMetricDeltaSummary(),
        periodLikes: metrics?.likes ?? emptyMetricDeltaSummary(),
        periodComments: metrics?.comments ?? emptyMetricDeltaSummary(),
        periodShares: metrics?.shares ?? emptyMetricDeltaSummary(),
        periodSaves: metrics?.saves ?? emptyMetricDeltaSummary(),
        periodReposts: metrics?.reposts ?? emptyMetricDeltaSummary(),
        rates: {
          engagementRate: rates?.engagementRate ?? null,
          shareRate: rates?.shareRate ?? null,
          commentRate: rates?.commentRate ?? null,
          saveRate: rates?.saveRate ?? null,
          repostRate: rates?.repostRate ?? null,
          engagementPer1000Views: rates?.engagementPerThousandViews ?? null,
        },
        score: scoresByPostId.get(post.id) ?? null,
        publishedInPeriod: classification?.publishedInPeriod ?? false,
        grewInPeriod: classification?.grewInPeriod ?? false,
        evergreen: classification?.evergreen ?? false,
        lateGrowth: classification?.lateGrowth ?? false,
      };
    })
    .filter((post) => (hasHistory ? post.grewInPeriod || post.publishedInPeriod : fallbackPosts.has(post.id)));
}

export function assembleDashboard(args: {
  snapshot: CachedProfileSnapshot;
  history: DashboardHistory;
  range: SearchRange;
  sort: SortKey;
  cacheStatus: DashboardPayload["cacheStatus"];
  lastUpdatedAt: string | null;
  needsRefresh: boolean;
  errorMessage: string | null;
}): DashboardPayload {
  const boundaries = buildPeriodBoundaries(args.range);
  const filterAvailability = buildFilterAvailability(args.snapshot.profile, args.snapshot.posts);
  const profileBoundarySet = buildSnapshotBoundarySet(args.history.profileDailySnapshots, boundaries);
  const profilePeriodMetrics = calculateProfilePeriodMetrics(profileBoundarySet, args.range);
  const enrichedPosts = buildEnrichedPosts({
    snapshot: args.snapshot,
    range: args.range,
    history: args.history,
  });
  const dashboardPosts = sortDashboardPosts(enrichedPosts, args.sort);
  const aggregates = buildPeriodAggregates(dashboardPosts, args.snapshot.profile.followers);
  const diagnostics = buildDiagnostics({
    aggregates,
    profilePeriodMetrics,
    posts: dashboardPosts,
  });

  return {
    profile: {
      username: args.snapshot.profile.username,
      displayName: args.snapshot.profile.display_name,
      biography: args.snapshot.profile.biography,
      profileUrl: args.snapshot.profile.profile_url,
      avatarUrl: args.snapshot.profile.avatar_url,
      followers: args.snapshot.profile.followers,
      following: args.snapshot.profile.following,
      likes: args.snapshot.profile.likes,
      videosCount: args.snapshot.profile.videos_count,
      isVerified: args.snapshot.profile.is_verified,
    },
    range: args.range,
    sort: args.sort,
    cacheStatus: args.cacheStatus,
    lastUpdatedAt: args.lastUpdatedAt,
    needsRefresh: args.needsRefresh,
    periodBoundaries: boundaries,
    filterAvailability,
    aggregates,
    lifetimeAggregates: buildLifetimeAggregates(toDashboardPosts(args.snapshot.posts)),
    profilePeriodMetrics,
    series: buildViewsDeltaSeries(toDashboardPosts(args.snapshot.posts), args.history.postDailySnapshots, args.range),
    posts: dashboardPosts,
    diagnostics,
    errorMessage: args.errorMessage,
  };
}
