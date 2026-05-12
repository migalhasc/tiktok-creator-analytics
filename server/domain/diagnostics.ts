import type { DashboardAggregates, DashboardDiagnostic, DashboardPost, DashboardProfilePeriodMetrics } from "@shared/domain";

function shortPostLabel(post: DashboardPost): string {
  const raw = post.description?.trim();
  if (!raw) {
    return "um post sem descrição pública";
  }

  return raw.length <= 56 ? raw : `${raw.slice(0, 53)}...`;
}

export function buildDiagnostics(args: {
  aggregates: DashboardAggregates;
  profilePeriodMetrics: DashboardProfilePeriodMetrics;
  posts: DashboardPost[];
}): DashboardDiagnostic[] {
  const diagnostics: DashboardDiagnostic[] = [];
  const growthPosts = args.posts.filter((post) => (post.periodViews.delta ?? 0) > 0);

  if (growthPosts.length > 0) {
    const averageViewsDelta =
      growthPosts.reduce((sum, post) => sum + (post.periodViews.delta ?? 0), 0) / growthPosts.length;
    const standoutGrowthPost = growthPosts.find((post) => (post.periodViews.delta ?? 0) > averageViewsDelta * 1.4);

    if (standoutGrowthPost) {
      diagnostics.push({
        id: "above-average-growth",
        category: "growth",
        message: `O post "${shortPostLabel(standoutGrowthPost)}" cresceu acima da média da janela atual.`,
      });
    }
  }

  const highSharePost = args.posts
    .filter((post) => (post.rates.shareRate ?? 0) >= 1.5)
    .sort((left, right) => (right.rates.shareRate ?? 0) - (left.rates.shareRate ?? 0))[0];

  if (highSharePost) {
    diagnostics.push({
      id: "high-share-rate",
      category: "efficiency",
      message: `O post "${shortPostLabel(highSharePost)}" mostrou share rate acima do normal para a janela.`,
    });
  }

  const highVolumeLowEfficiencyPost = args.posts.find(
    (post) => (post.periodViews.delta ?? 0) > 0 && (post.rates.engagementRate ?? 0) < 2,
  );

  if (highVolumeLowEfficiencyPost) {
    diagnostics.push({
      id: "high-volume-low-efficiency",
      category: "efficiency",
      message: `O post "${shortPostLabel(highVolumeLowEfficiencyPost)}" teve volume, mas eficiência relativa baixa.`,
    });
  }

  if (args.aggregates.evergreenPosts > args.aggregates.postsPublishedInPeriod && args.aggregates.evergreenPosts > 0) {
    diagnostics.push({
      id: "older-posts-driving-growth",
      category: "trend",
      message: "O crescimento da janela veio mais de posts antigos do que de posts publicados recentemente.",
    });
  }

  if ((args.profilePeriodMetrics.followers.deltaVsPrevious ?? 0) < 0) {
    diagnostics.push({
      id: "follower-growth-slowdown",
      category: "trend",
      message: "O crescimento de seguidores desacelerou em relação à janela anterior.",
    });
  }

  const replicationPost = args.posts
    .filter((post) => post.score != null && post.score > 0)
    .sort((left, right) => (right.score ?? 0) - (left.score ?? 0))[0];

  if (replicationPost) {
    const hashtagHint =
      replicationPost.hashtags.length > 0 ? ` com a linha de hashtag #${replicationPost.hashtags[0].replace(/^#/, "")}` : "";

    diagnostics.push({
      id: "replication-signal",
      category: "replication",
      message: `Sinal de replicação: vale testar uma nova variação do formato de "${shortPostLabel(replicationPost)}"${hashtagHint}.`,
    });
  }

  return diagnostics;
}
