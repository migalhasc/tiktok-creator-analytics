import type { FilterAvailabilityMap } from "@shared/domain";
import type { MetricSupport, PostRow, ProfileRow } from "./tiktok-types";

function getMetricSupport(profile: ProfileRow, _posts: PostRow[]): MetricSupport {
  const supportFromPayload = (profile.provider_payload?.metric_support ?? {}) as Partial<MetricSupport>;

  return {
    likes: supportFromPayload.likes ?? true,
    comments: supportFromPayload.comments ?? true,
    shares: supportFromPayload.shares ?? true,
    views: supportFromPayload.views ?? true,
    saves: true,
    reposts: false,
  };
}

export function buildFilterAvailability(profile: ProfileRow, posts: PostRow[]): FilterAvailabilityMap {
  const support = getMetricSupport(profile, posts);

  return {
    best: { enabled: true },
    liked: { enabled: support.likes },
    viewed: { enabled: support.views },
    shared: { enabled: support.shares },
    saved: { enabled: support.saves },
    reposted: { enabled: false, reason: "Reposts já entram agregados em compartilhamentos públicos." },
    commented: { enabled: support.comments },
    tier: { enabled: true },
    topRated: { enabled: true },
  };
}
