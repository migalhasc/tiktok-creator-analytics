import { Bookmark, ExternalLink, Heart, MessageCircle, Share2, type LucideIcon } from "lucide-react";
import type { DashboardPayload, DashboardPost } from "@shared/domain";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactNumber, formatPercent, formatPostDate } from "@/lib/format";

type PostsListProps = {
  dashboard: DashboardPayload;
};

function formatScore(value: number | null): string {
  if (value == null) return "N/D";
  return `${Math.round(value)}/100`;
}

function formatWindowViews(post: DashboardPost): string {
  return formatCompactNumber(post.periodViews.delta ?? post.periodViews.endValue ?? post.views);
}

function buildSignals(post: DashboardPost): string[] {
  const signals: string[] = [];

  if (post.publishedInPeriod) signals.push("Novo na janela");
  if (post.grewInPeriod) signals.push("Cresceu na janela");
  if (post.evergreen) signals.push("Evergreen");
  if (post.lateGrowth) signals.push("Crescimento tardio");

  return signals;
}

type PostMetricProps = {
  icon: LucideIcon;
  label: string;
  value: number | null;
};

function PostMetric({ icon: Icon, label, value }: PostMetricProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        <Icon className="size-3.5" />
        <span>{label}</span>
      </div>
      <p className="mt-1 text-sm font-semibold text-foreground">{formatCompactNumber(value)}</p>
    </div>
  );
}

export function PostsList({ dashboard }: PostsListProps) {
  if (dashboard.posts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Sem posts nesta janela.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-2 border-b border-border pb-4">
        <CardTitle>Posts</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <th className="px-6 py-3 font-medium">#</th>
                <th className="px-6 py-3 font-medium">Publicação</th>
                <th className="px-6 py-3 font-medium">Métricas básicas</th>
                <th className="px-6 py-3 font-medium text-right">Views na janela</th>
                <th className="px-6 py-3 font-medium text-right">Eficiência</th>
                <th className="px-6 py-3 font-medium text-right">Score</th>
                <th className="px-6 py-3 font-medium">Sinais</th>
                <th className="px-6 py-3 font-medium">Publicado em</th>
                <th className="px-6 py-3 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.posts.map((post, index) => {
                const signals = buildSignals(post);

                return (
                  <tr key={post.id} className="border-b border-border align-top last:border-b-0">
                    <td className="px-6 py-4 text-muted-foreground">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex min-w-[360px] gap-4">
                        <div className="flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                          {post.thumbnailUrl ? (
                            <img
                              src={post.thumbnailUrl}
                              alt={post.description?.trim() || `Capa do post de @${post.authorUsername}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">Sem capa</span>
                          )}
                        </div>

                        <div className="min-w-0 space-y-3">
                          <p className="line-clamp-2 text-sm font-medium text-foreground">
                            {post.description?.trim() || "Post sem descrição pública"}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge>@{post.authorUsername}</Badge>
                            {post.hashtags.slice(0, 3).map((hashtag) => (
                              <Badge key={hashtag}>#{hashtag.replace(/^#/, "")}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="grid min-w-[240px] grid-cols-2 gap-2">
                        <PostMetric icon={Heart} label="Curtidas" value={post.likes} />
                        <PostMetric icon={MessageCircle} label="Comentários" value={post.comments} />
                        <PostMetric icon={Bookmark} label="Salvos" value={post.saves} />
                        <PostMetric icon={Share2} label="Compart." value={post.shares} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-medium text-foreground">{formatWindowViews(post)}</p>
                      <p className="text-xs text-muted-foreground">
                        {post.periodViews.delta != null ? `Total ${formatCompactNumber(post.views)}` : "Total público"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-medium text-foreground">{formatPercent(post.rates.engagementRate)}</p>
                      <p className="text-xs text-muted-foreground">Share {formatPercent(post.rates.shareRate)}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-foreground">{formatScore(post.score)}</td>
                    <td className="px-6 py-4">
                      <div className="flex min-w-[180px] flex-wrap gap-2">
                        {signals.length > 0 ? (
                          signals.map((signal) => <Badge key={signal}>{signal}</Badge>)
                        ) : (
                          <span className="text-sm text-muted-foreground">Sem sinais</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{formatPostDate(post.publishedAt)}</td>
                    <td className="px-6 py-4">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        Ver post
                        <ExternalLink className="size-4" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
