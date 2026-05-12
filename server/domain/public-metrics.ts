type EngagementLike = {
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  reposts: number | null;
};

type ViewsLike = EngagementLike & {
  views: number | null;
};

function sumPresent(values: Array<number | null>): number | null {
  const present = values.filter((value): value is number => typeof value === "number");
  if (present.length === 0) {
    return null;
  }

  return present.reduce((sum, value) => sum + value, 0);
}

function calculateRate(numerator: number | null, denominator: number | null, multiplier = 100): number | null {
  if (numerator == null || denominator == null || denominator <= 0) {
    return null;
  }

  return (numerator / denominator) * multiplier;
}

export function calculateEngagementTotal(input: EngagementLike): number | null {
  return sumPresent([input.likes, input.comments, input.shares, input.saves]);
}

export function calculateEngagementRate(input: ViewsLike): number | null {
  return calculateRate(calculateEngagementTotal(input), input.views);
}

export function calculateShareRate(input: Pick<ViewsLike, "views" | "shares">): number | null {
  return calculateRate(input.shares, input.views);
}

export function calculateCommentRate(input: Pick<ViewsLike, "views" | "comments">): number | null {
  return calculateRate(input.comments, input.views);
}

export function calculateSaveRate(input: Pick<ViewsLike, "views" | "saves">): number | null {
  return calculateRate(input.saves, input.views);
}

export function calculateRepostRate(input: Pick<ViewsLike, "views" | "reposts">): number | null {
  return calculateRate(input.reposts, input.views);
}

export function calculateEngagementPerThousandViews(input: ViewsLike): number | null {
  return calculateRate(calculateEngagementTotal(input), input.views, 1000);
}

export function calculateGrowthRate(delta: number | null, previousValue: number | null): number | null {
  return calculateRate(delta, previousValue);
}
