import { rangeToDays, type SearchRange } from "@shared/domain";
import type { PostDailySnapshotRow, ProfileDailySnapshotRow } from "./tiktok-types";
import type { PostSnapshotBoundarySet, SnapshotBoundarySet } from "./snapshot-history";

export type PeriodMetricDelta = {
  startValue: number | null;
  endValue: number | null;
  delta: number | null;
  growthRate: number | null;
  previousStartValue: number | null;
  previousEndValue: number | null;
  previousDelta: number | null;
  deltaVsPrevious: number | null;
  averageDailyDelta: number | null;
};

export type ProfilePeriodMetrics = {
  followers: PeriodMetricDelta;
  following: PeriodMetricDelta;
  totalLikes: PeriodMetricDelta;
  totalPosts: PeriodMetricDelta;
};

export type PostPeriodMetrics = {
  postId: string;
  views: PeriodMetricDelta;
  likes: PeriodMetricDelta;
  comments: PeriodMetricDelta;
  shares: PeriodMetricDelta;
  saves: PeriodMetricDelta;
  reposts: PeriodMetricDelta;
};

function calculateDelta(endValue: number | null, startValue: number | null): number | null {
  if (endValue == null || startValue == null) {
    return null;
  }

  return endValue - startValue;
}

function calculateGrowthRate(delta: number | null, startValue: number | null): number | null {
  if (delta == null || startValue == null || startValue <= 0) {
    return null;
  }

  return (delta / startValue) * 100;
}

function calculateAverageDailyDelta(delta: number | null, range: SearchRange): number | null {
  if (delta == null) {
    return null;
  }

  return delta / rangeToDays[range];
}

export function calculatePeriodMetric<T>(
  boundarySet: SnapshotBoundarySet<T>,
  range: SearchRange,
  getValue: (snapshot: T) => number | null,
): PeriodMetricDelta {
  const startValue = boundarySet.currentStart ? getValue(boundarySet.currentStart) : null;
  const endValue = boundarySet.currentEnd ? getValue(boundarySet.currentEnd) : null;
  const previousStartValue = boundarySet.previousStart ? getValue(boundarySet.previousStart) : null;
  const previousEndValue = boundarySet.previousEnd ? getValue(boundarySet.previousEnd) : null;

  const delta = calculateDelta(endValue, startValue);
  const previousDelta = calculateDelta(previousEndValue, previousStartValue);

  return {
    startValue,
    endValue,
    delta,
    growthRate: calculateGrowthRate(delta, startValue),
    previousStartValue,
    previousEndValue,
    previousDelta,
    deltaVsPrevious: delta != null && previousDelta != null ? delta - previousDelta : null,
    averageDailyDelta: calculateAverageDailyDelta(delta, range),
  };
}

export function calculateProfilePeriodMetrics(
  boundarySet: SnapshotBoundarySet<ProfileDailySnapshotRow>,
  range: SearchRange,
): ProfilePeriodMetrics {
  return {
    followers: calculatePeriodMetric(boundarySet, range, (snapshot) => snapshot.followers),
    following: calculatePeriodMetric(boundarySet, range, (snapshot) => snapshot.following),
    totalLikes: calculatePeriodMetric(boundarySet, range, (snapshot) => snapshot.total_likes),
    totalPosts: calculatePeriodMetric(boundarySet, range, (snapshot) => snapshot.total_posts),
  };
}

export function calculatePostPeriodMetrics(
  boundarySets: Array<PostSnapshotBoundarySet<PostDailySnapshotRow>>,
  range: SearchRange,
): PostPeriodMetrics[] {
  return boundarySets.map((boundarySet) => ({
    postId: boundarySet.postId,
    views: calculatePeriodMetric(boundarySet, range, (snapshot) => snapshot.views),
    likes: calculatePeriodMetric(boundarySet, range, (snapshot) => snapshot.likes),
    comments: calculatePeriodMetric(boundarySet, range, (snapshot) => snapshot.comments),
    shares: calculatePeriodMetric(boundarySet, range, (snapshot) => snapshot.shares),
    saves: calculatePeriodMetric(boundarySet, range, (snapshot) => snapshot.saves),
    reposts: calculatePeriodMetric(boundarySet, range, (snapshot) => snapshot.reposts),
  }));
}
