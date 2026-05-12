import { describe, expect, it } from "vitest";
import { buildRankablePostMetrics, calculateNormalizedScores } from "../../server/domain/normalized-ranking.ts";
import type { PostPeriodMetrics } from "../../server/domain/delta-calculation.ts";

const periodMetrics: PostPeriodMetrics[] = [
  {
    postId: "big-low-efficiency",
    views: {
      startValue: 90000,
      endValue: 100000,
      delta: 10000,
      growthRate: 11.11,
      previousStartValue: 85000,
      previousEndValue: 90000,
      previousDelta: 5000,
      deltaVsPrevious: 5000,
      averageDailyDelta: 1428.57,
    },
    likes: {
      startValue: 1500,
      endValue: 1700,
      delta: 200,
      growthRate: 13.33,
      previousStartValue: 1400,
      previousEndValue: 1500,
      previousDelta: 100,
      deltaVsPrevious: 100,
      averageDailyDelta: 28.57,
    },
    comments: {
      startValue: 70,
      endValue: 80,
      delta: 10,
      growthRate: 14.28,
      previousStartValue: 65,
      previousEndValue: 70,
      previousDelta: 5,
      deltaVsPrevious: 5,
      averageDailyDelta: 1.42,
    },
    shares: {
      startValue: 25,
      endValue: 30,
      delta: 5,
      growthRate: 20,
      previousStartValue: 20,
      previousEndValue: 25,
      previousDelta: 5,
      deltaVsPrevious: 0,
      averageDailyDelta: 0.71,
    },
    saves: {
      startValue: null,
      endValue: null,
      delta: null,
      growthRate: null,
      previousStartValue: null,
      previousEndValue: null,
      previousDelta: null,
      deltaVsPrevious: null,
      averageDailyDelta: null,
    },
    reposts: {
      startValue: null,
      endValue: null,
      delta: null,
      growthRate: null,
      previousStartValue: null,
      previousEndValue: null,
      previousDelta: null,
      deltaVsPrevious: null,
      averageDailyDelta: null,
    },
  },
  {
    postId: "smaller-high-efficiency",
    views: {
      startValue: 4000,
      endValue: 9000,
      delta: 5000,
      growthRate: 125,
      previousStartValue: 3000,
      previousEndValue: 4000,
      previousDelta: 1000,
      deltaVsPrevious: 4000,
      averageDailyDelta: 714.28,
    },
    likes: {
      startValue: 500,
      endValue: 900,
      delta: 400,
      growthRate: 80,
      previousStartValue: 300,
      previousEndValue: 500,
      previousDelta: 200,
      deltaVsPrevious: 200,
      averageDailyDelta: 57.14,
    },
    comments: {
      startValue: 80,
      endValue: 160,
      delta: 80,
      growthRate: 100,
      previousStartValue: 50,
      previousEndValue: 80,
      previousDelta: 30,
      deltaVsPrevious: 50,
      averageDailyDelta: 11.42,
    },
    shares: {
      startValue: 40,
      endValue: 110,
      delta: 70,
      growthRate: 175,
      previousStartValue: 15,
      previousEndValue: 40,
      previousDelta: 25,
      deltaVsPrevious: 45,
      averageDailyDelta: 10,
    },
    saves: {
      startValue: 10,
      endValue: 40,
      delta: 30,
      growthRate: 300,
      previousStartValue: 5,
      previousEndValue: 10,
      previousDelta: 5,
      deltaVsPrevious: 25,
      averageDailyDelta: 4.28,
    },
    reposts: {
      startValue: 0,
      endValue: 10,
      delta: 10,
      growthRate: null,
      previousStartValue: 0,
      previousEndValue: 0,
      previousDelta: 0,
      deltaVsPrevious: 10,
      averageDailyDelta: 1.42,
    },
  },
];

describe("normalized-ranking", () => {
  it("ranks efficient posts above larger but weaker posts", () => {
    const rankable = buildRankablePostMetrics(periodMetrics, [
      {
        postId: "big-low-efficiency",
        engagementRate: 2.15,
        shareRate: 0.5,
        commentRate: 0.1,
        saveRate: null,
        repostRate: null,
        engagementPerThousandViews: 21.5,
      },
      {
        postId: "smaller-high-efficiency",
        engagementRate: 11.8,
        shareRate: 1.8,
        commentRate: 2,
        saveRate: 0.8,
        repostRate: 0.2,
        engagementPerThousandViews: 118,
      },
    ]);

    const scores = calculateNormalizedScores(rankable);
    const scoreMap = new Map(scores.map((entry) => [entry.postId, entry.score]));

    expect((scoreMap.get("smaller-high-efficiency") ?? 0)).toBeGreaterThan(
      scoreMap.get("big-low-efficiency") ?? 0,
    );
  });
});
