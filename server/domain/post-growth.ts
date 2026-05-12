import type { PeriodBoundaries } from "./snapshot-history";
import type { PostPeriodMetrics } from "./delta-calculation";

type PostLike = {
  id: string;
  publishedAt: string | null;
};

export type PostGrowthClassification = {
  postId: string;
  publishedInPeriod: boolean;
  grewInPeriod: boolean;
  evergreen: boolean;
  lateGrowth: boolean;
};

function toSnapshotDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return value.slice(0, 10);
}

function isBetween(value: string, start: string, end: string): boolean {
  return value >= start && value <= end;
}

export function classifyPostGrowth(
  posts: PostLike[],
  periodMetrics: PostPeriodMetrics[],
  boundaries: PeriodBoundaries,
): PostGrowthClassification[] {
  const postById = new Map(posts.map((post) => [post.id, post]));

  return periodMetrics.map((metrics) => {
    const post = postById.get(metrics.postId);
    const publishedAt = toSnapshotDate(post?.publishedAt ?? null);
    const publishedInPeriod =
      publishedAt != null && isBetween(publishedAt, boundaries.currentStartDate, boundaries.currentEndDate);
    const viewsDelta = metrics.views.delta ?? 0;
    const previousViewsDelta = metrics.views.previousDelta ?? 0;
    const grewInPeriod = viewsDelta > 0;
    const evergreen = !publishedInPeriod && viewsDelta > 0;
    const lateGrowth = evergreen && viewsDelta > previousViewsDelta;

    return {
      postId: metrics.postId,
      publishedInPeriod,
      grewInPeriod,
      evergreen,
      lateGrowth,
    };
  });
}
