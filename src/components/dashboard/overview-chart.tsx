import { useId, useMemo } from "react";
import type { DashboardPayload, DashboardPost } from "@shared/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactNumber } from "@/lib/format";

type OverviewChartProps = {
  dashboard: DashboardPayload;
};

type Bucket = {
  key: string;
  label: string;
  value: number;
  hasData: boolean;
};

type Point = {
  x: number;
  y: number;
  bucket: Bucket;
};

function buildBuckets(dashboard: DashboardPayload): Bucket[] {
  return dashboard.series.map((point) => ({
    key: point.date,
    label: point.label,
    value: point.viewsDelta ?? 0,
    hasData: point.viewsDelta != null,
  }));
}

function buildPoints(buckets: Bucket[], width: number, height: number): Point[] {
  const maxValue = Math.max(...buckets.map((bucket) => bucket.value), 1);

  return buckets.map((bucket, index) => ({
    x: buckets.length > 1 ? (index * width) / (buckets.length - 1) : width / 2,
    y: height - (bucket.value / maxValue) * height,
    bucket,
  }));
}

function buildSmoothPath(points: Point[], smoothing = 1) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;

    const cp1x = p1.x + ((p2.x - p0.x) / 6) * smoothing;
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * smoothing;
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * smoothing;
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * smoothing;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return path;
}

function buildAreaPath(linePath: string, points: Point[], bottomY: number) {
  if (!linePath || points.length === 0) return "";
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath} L ${last.x.toFixed(2)} ${bottomY.toFixed(2)} L ${first.x.toFixed(2)} ${bottomY.toFixed(2)} Z`;
}

function getWindowViews(post: DashboardPost): number {
  return post.periodViews.delta ?? post.periodViews.endValue ?? post.views ?? 0;
}

function pickTopPosts(posts: DashboardPost[]) {
  return [...posts]
    .sort((left, right) => getWindowViews(right) - getWindowViews(left))
    .slice(0, 5);
}

export function OverviewChart({ dashboard }: OverviewChartProps) {
  const gradientId = useId().replace(/:/g, "-");
  const buckets = useMemo(() => buildBuckets(dashboard), [dashboard]);
  const totalViews = dashboard.aggregates.totalViews ?? buckets.reduce((sum, bucket) => sum + bucket.value, 0);
  const peakBucket = buckets.reduce<Bucket | null>((peak, bucket) => {
    if (!peak || bucket.value > peak.value) return bucket;
    return peak;
  }, null);
  const maxValue = Math.max(...buckets.map((bucket) => bucket.value), 1);
  const points = buildPoints(buckets, 100, 66);
  const linePath = buildSmoothPath(points);
  const areaPath = buildAreaPath(linePath, points, 66);
  const topPosts = pickTopPosts(dashboard.posts);
  const maxPostViews = Math.max(...topPosts.map((post) => getWindowViews(post)), 1);
  const labelStep = Math.max(1, Math.ceil(Math.max(buckets.length, 1) / 6));
  const tickValues = Array.from({ length: 4 }, (_, index) => Math.round((maxValue * (3 - index)) / 3));
  const hasHistoricalSeries = buckets.some((bucket) => bucket.hasData);

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>Crescimento</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Views ganhas na janela</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{formatCompactNumber(totalViews)}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pico diário</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{formatCompactNumber(peakBucket?.value ?? 0)}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Melhor dia</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{peakBucket?.label ?? "Sem dados"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">Views por dia</p>
              <p className="text-xs text-muted-foreground">{hasHistoricalSeries ? "Histórico diário" : "Sem histórico"}</p>
            </div>

            <div className="grid grid-cols-[48px_minmax(0,1fr)] gap-4">
              <div className="flex h-[240px] flex-col justify-between text-xs text-muted-foreground">
                {tickValues.map((value, index) => (
                  <span key={`${value}-${index}`}>{formatCompactNumber(value)}</span>
                ))}
              </div>

              <div className="space-y-3">
                <div className="relative h-[240px] overflow-hidden rounded-xl border border-border bg-muted/25 px-3 py-3">
                  <div className="absolute inset-x-3 inset-y-3 grid grid-rows-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="border-b border-dashed border-border last:border-b-0" />
                    ))}
                  </div>

                  <svg viewBox="0 0 100 72" className="relative h-full w-full" preserveAspectRatio="none" aria-label="Gráfico de crescimento diário">
                    <defs>
                      <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>

                    {areaPath ? <path d={areaPath} fill={`url(#${gradientId})`} className="text-foreground" /> : null}
                    {linePath ? <path d={linePath} fill="none" stroke="currentColor" strokeWidth="1.8" className="text-foreground" /> : null}

                    {points.map((point, index) => {
                      const isPeak = point.bucket.key === peakBucket?.key && point.bucket.value > 0;
                      const isLast = index === points.length - 1 && point.bucket.value > 0;

                      return (
                        <circle
                          key={point.bucket.key}
                          cx={point.x}
                          cy={point.y}
                          r={isPeak || isLast ? 1.8 : 1.05}
                          className={isPeak || isLast ? "fill-foreground" : "fill-foreground/60"}
                        />
                      );
                    })}
                  </svg>
                </div>

                <div className="flex items-center justify-between gap-2 overflow-x-auto text-xs text-muted-foreground">
                  {buckets.map((bucket, index) => (
                    <span key={bucket.key} className={index % labelStep === 0 || index === buckets.length - 1 ? "opacity-100" : "opacity-0"}>
                      {bucket.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">Posts em crescimento</p>
              <p className="text-xs text-muted-foreground">{hasHistoricalSeries ? "Janela atual" : "Base pública"}</p>
            </div>

            <div className="space-y-4">
              {topPosts.length > 0 ? (
                topPosts.map((post, index) => {
                  const windowViews = getWindowViews(post);
                  const width = `${Math.max(8, (windowViews / maxPostViews) * 100)}%`;

                  return (
                    <div key={post.id} className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {post.description?.trim() || `Publicação ${index + 1}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {post.periodViews.delta != null ? "Janela" : "Total público"}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-foreground">{formatCompactNumber(windowViews)}</span>
                      </div>

                      <div className="h-2.5 rounded-full bg-muted">
                        <div className="h-2.5 rounded-full bg-foreground" style={{ width }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">Sem posts.</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
