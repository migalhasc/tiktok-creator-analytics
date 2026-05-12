import { describe, expect, it } from "vitest";
import {
  calculateEngagementRate,
  calculateEngagementTotal,
  calculateRateEngagementTotal,
  sumNullable,
} from "../../server/domain/engagement.ts";

describe("engagement helpers", () => {
  it("adds only confirmed engagement metrics", () => {
    expect(
      calculateEngagementTotal({
        likes: 100,
        comments: 20,
        shares: 10,
        saves: null,
      }),
    ).toBe(130);
  });

  it("returns null when every engagement metric is missing", () => {
    expect(
      calculateEngagementTotal({
        likes: null,
        comments: null,
        shares: null,
        saves: null,
      }),
    ).toBeNull();
  });

  it("uses the market-style numerator for engagement rates", () => {
    expect(
      calculateRateEngagementTotal({
        likes: 100,
        comments: 20,
        shares: 10,
      }),
    ).toBe(130);
  });

  it("calculates engagement rates as percentages", () => {
    expect(calculateEngagementRate(130, 1000)).toBe(13);
    expect(calculateEngagementRate(130, 0)).toBeNull();
  });

  it("sums nullable lists without inventing zeros", () => {
    expect(sumNullable([null, 10, 5])).toBe(15);
    expect(sumNullable([null, null])).toBeNull();
  });
});
