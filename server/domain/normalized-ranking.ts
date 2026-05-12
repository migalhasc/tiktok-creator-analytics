import type { PostPeriodMetrics } from "./delta-calculation";

export type RankablePostMetrics = {
  postId: string;
  engagementRate: number | null;
  shareRate: number | null;
  commentRate: number | null;
  saveRate: number | null;
  repostRate: number | null;
  engagementPerThousandViews: number | null;
  viewsDelta: number | null;
  viewsDeltaVsPrevious: number | null;
};

export type RankedPostScore = {
  postId: string;
  score: number | null;
};

const weightedMetricConfig = [
  { key: "engagementRate", weight: 0.26 },
  { key: "shareRate", weight: 0.18 },
  { key: "commentRate", weight: 0.14 },
  { key: "saveRate", weight: 0.14 },
  { key: "engagementPerThousandViews", weight: 0.12 },
  { key: "viewsDelta", weight: 0.11 },
  { key: "viewsDeltaVsPrevious", weight: 0.05 },
] as const satisfies Array<{ key: keyof RankablePostMetrics; weight: number }>;

function normalizeMetricValue(values: Array<number | null>, value: number | null): number | null {
  if (value == null) {
    return null;
  }

  const presentValues = values.filter((entry): entry is number => typeof entry === "number");
  if (presentValues.length === 0) {
    return null;
  }

  const maxValue = Math.max(...presentValues);
  if (maxValue <= 0) {
    return null;
  }

  return value / maxValue;
}

export function buildRankablePostMetrics(
  periodMetrics: PostPeriodMetrics[],
  derivedRates: Array<{
    postId: string;
    engagementRate: number | null;
    shareRate: number | null;
    commentRate: number | null;
    saveRate: number | null;
    repostRate: number | null;
    engagementPerThousandViews: number | null;
  }>,
): RankablePostMetrics[] {
  const ratesByPostId = new Map(derivedRates.map((rate) => [rate.postId, rate]));

  return periodMetrics.map((metrics) => {
    const rates = ratesByPostId.get(metrics.postId);

    return {
      postId: metrics.postId,
      engagementRate: rates?.engagementRate ?? null,
      shareRate: rates?.shareRate ?? null,
      commentRate: rates?.commentRate ?? null,
      saveRate: rates?.saveRate ?? null,
      repostRate: rates?.repostRate ?? null,
      engagementPerThousandViews: rates?.engagementPerThousandViews ?? null,
      viewsDelta: metrics.views.delta,
      viewsDeltaVsPrevious: metrics.views.deltaVsPrevious,
    };
  });
}

export function calculateNormalizedScores(posts: RankablePostMetrics[]): RankedPostScore[] {
  return posts.map((post) => {
    let weightedSum = 0;
    let appliedWeight = 0;

    for (const config of weightedMetricConfig) {
      const normalizedValue = normalizeMetricValue(
        posts.map((candidate) => candidate[config.key]),
        post[config.key],
      );

      if (normalizedValue == null) {
        continue;
      }

      weightedSum += normalizedValue * config.weight;
      appliedWeight += config.weight;
    }

    return {
      postId: post.postId,
      score: appliedWeight > 0 ? (weightedSum / appliedWeight) * 100 : null,
    };
  });
}
