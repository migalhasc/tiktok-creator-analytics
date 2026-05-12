import { describe, expect, it } from "vitest";
import { classifyPostGrowth } from "../../server/domain/post-growth.ts";
import type { PeriodBoundaries } from "../../server/domain/snapshot-history.ts";
import type { PostPeriodMetrics } from "../../server/domain/delta-calculation.ts";

const boundaries: PeriodBoundaries = {
  currentStartDate: "2026-05-05",
  currentEndDate: "2026-05-11",
  previousStartDate: "2026-04-28",
  previousEndDate: "2026-05-04",
};

const periodMetrics: PostPeriodMetrics[] = [
  {
    postId: "post-1",
    views: {
      startValue: 1000,
      endValue: 1800,
      delta: 800,
      growthRate: 80,
      previousStartValue: 600,
      previousEndValue: 900,
      previousDelta: 300,
      deltaVsPrevious: 500,
      averageDailyDelta: 114.2857,
    },
    likes: {
      startValue: 100,
      endValue: 150,
      delta: 50,
      growthRate: 50,
      previousStartValue: 60,
      previousEndValue: 90,
      previousDelta: 30,
      deltaVsPrevious: 20,
      averageDailyDelta: 7.1428,
    },
    comments: {
      startValue: 10,
      endValue: 25,
      delta: 15,
      growthRate: 150,
      previousStartValue: 6,
      previousEndValue: 9,
      previousDelta: 3,
      deltaVsPrevious: 12,
      averageDailyDelta: 2.1428,
    },
    shares: {
      startValue: 5,
      endValue: 9,
      delta: 4,
      growthRate: 80,
      previousStartValue: 3,
      previousEndValue: 4,
      previousDelta: 1,
      deltaVsPrevious: 3,
      averageDailyDelta: 0.5714,
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
    postId: "post-2",
    views: {
      startValue: 100,
      endValue: 110,
      delta: 10,
      growthRate: 10,
      previousStartValue: 90,
      previousEndValue: 120,
      previousDelta: 30,
      deltaVsPrevious: -20,
      averageDailyDelta: 1.4285,
    },
    likes: {
      startValue: 10,
      endValue: 11,
      delta: 1,
      growthRate: 10,
      previousStartValue: 8,
      previousEndValue: 12,
      previousDelta: 4,
      deltaVsPrevious: -3,
      averageDailyDelta: 0.1428,
    },
    comments: {
      startValue: 1,
      endValue: 1,
      delta: 0,
      growthRate: 0,
      previousStartValue: 1,
      previousEndValue: 1,
      previousDelta: 0,
      deltaVsPrevious: 0,
      averageDailyDelta: 0,
    },
    shares: {
      startValue: 0,
      endValue: 0,
      delta: 0,
      growthRate: null,
      previousStartValue: 0,
      previousEndValue: 1,
      previousDelta: 1,
      deltaVsPrevious: -1,
      averageDailyDelta: 0,
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
];

describe("post-growth classification", () => {
  it("distinguishes published-in-period posts from older evergreen posts", () => {
    const results = classifyPostGrowth(
      [
        { id: "post-1", publishedAt: "2026-05-01T10:00:00.000Z" },
        { id: "post-2", publishedAt: "2026-05-06T10:00:00.000Z" },
      ],
      periodMetrics,
      boundaries,
    );

    expect(results).toEqual(
      expect.arrayContaining([
        {
          postId: "post-1",
          publishedInPeriod: false,
          grewInPeriod: true,
          evergreen: true,
          lateGrowth: true,
        },
        {
          postId: "post-2",
          publishedInPeriod: true,
          grewInPeriod: true,
          evergreen: false,
          lateGrowth: false,
        },
      ]),
    );
  });
});
