import type { DashboardPost } from "@shared/domain";
import type { PostRow } from "./tiktok-types";

const engagementKeys = ["likes", "comments", "shares", "saves"] as const;
const rateEngagementKeys = ["likes", "comments", "shares"] as const;

export function calculateEngagementTotal(post: Pick<PostRow | DashboardPost, (typeof engagementKeys)[number]>): number | null {
  const values = engagementKeys
    .map((key) => post[key])
    .filter((value): value is number => typeof value === "number");

  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0);
}

export function calculateRateEngagementTotal(
  post: Pick<PostRow | DashboardPost, (typeof rateEngagementKeys)[number]>,
): number | null {
  const values = rateEngagementKeys
    .map((key) => post[key])
    .filter((value): value is number => typeof value === "number");

  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0);
}

export function calculateEngagementRate(engagement: number | null, denominator: number | null): number | null {
  if (engagement == null || denominator == null || denominator <= 0) {
    return null;
  }

  return (engagement / denominator) * 100;
}

export function sumNullable(values: Array<number | null>): number | null {
  const presentValues = values.filter((value): value is number => typeof value === "number");
  if (presentValues.length === 0) {
    return null;
  }

  return presentValues.reduce((sum, value) => sum + value, 0);
}
