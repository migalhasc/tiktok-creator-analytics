import { describe, expect, it } from "vitest";
import {
  calculateCommentRate,
  calculateEngagementPerThousandViews,
  calculateEngagementRate,
  calculateEngagementTotal,
  calculateGrowthRate,
  calculateRepostRate,
  calculateSaveRate,
  calculateShareRate,
} from "../../server/domain/public-metrics.ts";

describe("public-metrics", () => {
  it("calculates engagement total with public shares already absorbing reposts", () => {
    expect(
      calculateEngagementTotal({
        likes: 100,
        comments: 20,
        shares: 10,
        saves: 5,
        reposts: 3,
      }),
    ).toBe(135);
  });

  it("ignores unavailable saves and reposts without inventing zeros", () => {
    expect(
      calculateEngagementRate({
        views: 1000,
        likes: 100,
        comments: 20,
        shares: 10,
        saves: null,
        reposts: null,
      }),
    ).toBe(13);

    expect(
      calculateSaveRate({
        views: 1000,
        saves: null,
      }),
    ).toBeNull();
  });

  it("calculates public relative quality metrics", () => {
    expect(
      calculateShareRate({
        views: 1000,
        shares: 25,
      }),
    ).toBe(2.5);
    expect(
      calculateCommentRate({
        views: 1000,
        comments: 40,
      }),
    ).toBe(4);
    expect(
      calculateRepostRate({
        views: 1000,
        reposts: 10,
      }),
    ).toBe(1);
    expect(
      calculateEngagementPerThousandViews({
        views: 1000,
        likes: 100,
        comments: 20,
        shares: 10,
        saves: 5,
        reposts: 3,
      }),
    ).toBe(135);
    expect(calculateGrowthRate(400, 800)).toBe(50);
  });
});
