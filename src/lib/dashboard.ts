import type { DashboardPayload } from "@shared/domain";

export function hasPeriodHistory(dashboard: DashboardPayload): boolean {
  if (
    dashboard.aggregates.totalViews != null ||
    dashboard.aggregates.totalEngagement != null ||
    dashboard.profilePeriodMetrics.followers.delta != null ||
    dashboard.profilePeriodMetrics.totalLikes.delta != null
  ) {
    return true;
  }

  if (dashboard.series.some((point) => point.viewsDelta != null)) {
    return true;
  }

  return dashboard.posts.some(
    (post) =>
      post.periodViews.delta != null ||
      post.periodLikes.delta != null ||
      post.periodComments.delta != null ||
      post.periodShares.delta != null,
  );
}
