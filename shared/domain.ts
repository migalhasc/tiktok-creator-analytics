export const searchRangeValues = ["7d", "30d", "90d"] as const;
export type SearchRange = (typeof searchRangeValues)[number];

export const sortKeyValues = [
  "best",
  "liked",
  "viewed",
  "shared",
  "saved",
  "reposted",
  "commented",
  "tier",
  "topRated",
] as const;
export type SortKey = (typeof sortKeyValues)[number];

export const defaultRange: SearchRange = "30d";
export const defaultSort: SortKey = "best";

export const rangeToDays: Record<SearchRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export const rangeLabels: Record<SearchRange, string> = {
  "7d": "7 dias",
  "30d": "30 dias",
  "90d": "90 dias",
};

export const sortLabels: Record<SortKey, string> = {
  best: "Melhores posts",
  liked: "Mais curtidos",
  viewed: "Mais vistos",
  shared: "Mais compartilhados",
  saved: "Mais salvos",
  reposted: "Mais repostados",
  commented: "Mais comentados",
  tier: "Tier list",
  topRated: "Top-rated posts",
};

export const sortDescriptions: Record<SortKey, string> = {
  best: "Ranking por engajamento total confirmado.",
  liked: "Ordenado por curtidas.",
  viewed: "Ordenado por visualizações.",
  shared: "Ordenado por compartilhamentos.",
  saved: "Ordenado por salvamentos.",
  reposted: "Ordenado por repostagens.",
  commented: "Ordenado por comentários.",
  tier: "Agrupado em tiers por percentil.",
  topRated: "Mesmo ranking do filtro de melhores posts.",
};

export const metricSortKeys = ["liked", "viewed", "shared", "saved", "reposted", "commented"] as const;
export type MetricSortKey = (typeof metricSortKeys)[number];

export type CacheStatus = "fresh" | "stale" | "refreshing" | "error";
export type PostTier = "S" | "A" | "B" | "C";

export type FilterAvailability = {
  enabled: boolean;
  reason?: string;
};

export type FilterAvailabilityMap = Record<SortKey, FilterAvailability>;

export type DashboardProfile = {
  username: string;
  displayName: string | null;
  biography: string | null;
  profileUrl: string;
  avatarUrl: string | null;
  followers: number | null;
  following: number | null;
  likes: number | null;
  videosCount: number | null;
  isVerified: boolean | null;
};

export type MetricDeltaSummary = {
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

export type DashboardPostRates = {
  engagementRate: number | null;
  shareRate: number | null;
  commentRate: number | null;
  saveRate: number | null;
  repostRate: number | null;
  engagementPer1000Views: number | null;
};

export type DashboardPost = {
  id: string;
  url: string;
  description: string | null;
  authorUsername: string;
  publishedAt: string | null;
  hashtags: string[];
  likes: number | null;
  comments: number | null;
  shares: number | null;
  views: number | null;
  saves: number | null;
  reposts: number | null;
  engagementTotal: number | null;
  periodViews: MetricDeltaSummary;
  periodLikes: MetricDeltaSummary;
  periodComments: MetricDeltaSummary;
  periodShares: MetricDeltaSummary;
  periodSaves: MetricDeltaSummary;
  periodReposts: MetricDeltaSummary;
  rates: DashboardPostRates;
  score: number | null;
  publishedInPeriod: boolean;
  grewInPeriod: boolean;
  evergreen: boolean;
  lateGrowth: boolean;
  tier: PostTier | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
};

export type DashboardAggregates = {
  postsCount: number;
  totalViews: number | null;
  totalLikes: number | null;
  totalComments: number | null;
  totalShares: number | null;
  totalSaves: number | null;
  totalReposts: number | null;
  totalEngagement: number | null;
  engagementRateByViews: number | null;
  engagementRateByFollowers: number | null;
  shareRate: number | null;
  commentRate: number | null;
  saveRate: number | null;
  repostRate: number | null;
  engagementPer1000Views: number | null;
  postsPublishedInPeriod: number;
  postsGrowingInPeriod: number;
  evergreenPosts: number;
};

export type DashboardProfilePeriodMetrics = {
  followers: MetricDeltaSummary;
  following: MetricDeltaSummary;
  totalLikes: MetricDeltaSummary;
  totalPosts: MetricDeltaSummary;
};

export type DashboardLifetimeAggregates = {
  postsCount: number;
  totalViews: number | null;
  totalLikes: number | null;
  totalComments: number | null;
  totalShares: number | null;
  totalSaves: number | null;
  totalReposts: number | null;
  totalEngagement: number | null;
};

export type DashboardSeriesPoint = {
  date: string;
  label: string;
  viewsDelta: number | null;
};

export type DashboardDiagnostic = {
  id: string;
  category: "growth" | "efficiency" | "trend" | "replication";
  message: string;
};

export type DashboardPayload = {
  profile: DashboardProfile;
  range: SearchRange;
  sort: SortKey;
  cacheStatus: CacheStatus;
  lastUpdatedAt: string | null;
  needsRefresh: boolean;
  periodBoundaries: {
    currentStartDate: string;
    currentEndDate: string;
    previousStartDate: string;
    previousEndDate: string;
  };
  filterAvailability: FilterAvailabilityMap;
  aggregates: DashboardAggregates;
  lifetimeAggregates: DashboardLifetimeAggregates;
  profilePeriodMetrics: DashboardProfilePeriodMetrics;
  series: DashboardSeriesPoint[];
  posts: DashboardPost[];
  diagnostics: DashboardDiagnostic[];
  errorMessage: string | null;
};

export function isSearchRange(value: string | null | undefined): value is SearchRange {
  return searchRangeValues.includes((value ?? "") as SearchRange);
}

export function isSortKey(value: string | null | undefined): value is SortKey {
  return sortKeyValues.includes((value ?? "") as SortKey);
}
