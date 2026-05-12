import { CircleHelp } from "lucide-react";
import { rangeLabels, type DashboardPayload, type MetricDeltaSummary } from "@shared/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPeriodHistory } from "@/lib/dashboard";
import { formatCompactNumber, formatPercent } from "@/lib/format";

type MetricGridProps = {
  dashboard: DashboardPayload;
};

type MetricDefinition = {
  label: string;
  value: (dashboard: DashboardPayload) => string;
  description: (dashboard: DashboardPayload) => string;
};

function formatSignedCompactNumber(value: number | null): string {
  if (value == null) return "N/D";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatCompactNumber(value)}`;
}

function describePreviousWindow(metric: MetricDeltaSummary): string {
  if (metric.delta == null) {
    return "Sem histórico";
  }

  if (metric.previousDelta == null) {
    return `${formatSignedCompactNumber(metric.delta)} na janela`;
  }

  const comparison = metric.deltaVsPrevious ?? metric.delta - metric.previousDelta;
  const direction = comparison > 0 ? "acima" : comparison < 0 ? "abaixo" : "estável";

  return `${formatSignedCompactNumber(metric.delta)} vs ${formatSignedCompactNumber(metric.previousDelta)} ${direction}`;
}

function formatLifetimeEngagementRate(dashboard: DashboardPayload): string {
  const { totalEngagement, totalViews } = dashboard.lifetimeAggregates;
  if (totalEngagement == null || totalViews == null || totalViews <= 0) {
    return "N/D";
  }

  return formatPercent((totalEngagement / totalViews) * 100);
}

function formatLifetimeRate(
  numerator: number | null,
  denominator: number | null,
): string {
  if (numerator == null || denominator == null || denominator <= 0) {
    return "N/D";
  }

  return formatPercent((numerator / denominator) * 100);
}

function formatLifetimePerThousand(
  numerator: number | null,
  denominator: number | null,
): string {
  if (numerator == null || denominator == null || denominator <= 0) {
    return "N/D";
  }

  return formatCompactNumber((numerator / denominator) * 1000);
}

const periodMetrics: readonly MetricDefinition[] = [
  {
    label: "Views ganhas",
    value: (dashboard: DashboardPayload) => formatCompactNumber(dashboard.aggregates.totalViews),
    description: (dashboard: DashboardPayload) => `Janela ${rangeLabels[dashboard.range]}`,
  },
  {
    label: "Interações ganhas",
    value: (dashboard: DashboardPayload) => formatCompactNumber(dashboard.aggregates.totalEngagement),
    description: () => "Na janela",
  },
  {
    label: "Seguidores ganhos",
    value: (dashboard: DashboardPayload) => formatSignedCompactNumber(dashboard.profilePeriodMetrics.followers.delta),
    description: (dashboard: DashboardPayload) => describePreviousWindow(dashboard.profilePeriodMetrics.followers),
  },
  {
    label: "Engagement rate",
    value: (dashboard: DashboardPayload) => formatPercent(dashboard.aggregates.engagementRateByViews),
    description: () => "Por views",
  },
  {
    label: "Share rate",
    value: (dashboard: DashboardPayload) => formatPercent(dashboard.aggregates.shareRate),
    description: () => "Compart./views",
  },
  {
    label: "Comment rate",
    value: (dashboard: DashboardPayload) => formatPercent(dashboard.aggregates.commentRate),
    description: () => "Coment./views",
  },
  {
    label: "Save rate",
    value: (dashboard: DashboardPayload) => formatPercent(dashboard.aggregates.saveRate),
    description: () => "Salvos/views",
  },
  {
    label: "Engaj. por 1.000 views",
    value: (dashboard: DashboardPayload) => formatCompactNumber(dashboard.aggregates.engagementPer1000Views),
    description: () => "Normalizado",
  },
  {
    label: "Posts em crescimento",
    value: (dashboard: DashboardPayload) => formatCompactNumber(dashboard.aggregates.postsGrowingInPeriod),
    description: () => "Ganharam views",
  },
  {
    label: "Publicados na janela",
    value: (dashboard: DashboardPayload) => formatCompactNumber(dashboard.aggregates.postsPublishedInPeriod),
    description: () => "Posts novos",
  },
  {
    label: "Evergreens ativos",
    value: (dashboard: DashboardPayload) => formatCompactNumber(dashboard.aggregates.evergreenPosts),
    description: () => "Continuam subindo",
  },
] as const;

const baselineMetrics: readonly MetricDefinition[] = [
  {
    label: "Views públicas atuais",
    value: (dashboard: DashboardPayload) => formatCompactNumber(dashboard.lifetimeAggregates.totalViews),
    description: () => "Base pública",
  },
  {
    label: "Interações atuais",
    value: (dashboard: DashboardPayload) => formatCompactNumber(dashboard.lifetimeAggregates.totalEngagement),
    description: () => "Base pública",
  },
  {
    label: "Seguidores atuais",
    value: (dashboard: DashboardPayload) => formatCompactNumber(dashboard.profile.followers),
    description: () => "Perfil atual",
  },
  {
    label: "ER atual por views",
    value: (dashboard: DashboardPayload) => formatLifetimeEngagementRate(dashboard),
    description: () => "Base pública",
  },
  {
    label: "Share rate atual",
    value: (dashboard: DashboardPayload) =>
      formatLifetimeRate(dashboard.lifetimeAggregates.totalShares, dashboard.lifetimeAggregates.totalViews),
    description: () => "Compart./views",
  },
  {
    label: "Comment rate atual",
    value: (dashboard: DashboardPayload) =>
      formatLifetimeRate(dashboard.lifetimeAggregates.totalComments, dashboard.lifetimeAggregates.totalViews),
    description: () => "Coment./views",
  },
  {
    label: "Save rate atual",
    value: (dashboard: DashboardPayload) =>
      formatLifetimeRate(dashboard.lifetimeAggregates.totalSaves, dashboard.lifetimeAggregates.totalViews),
    description: () => "Salvos/views",
  },
  {
    label: "Engaj. atual por 1.000 views",
    value: (dashboard: DashboardPayload) =>
      formatLifetimePerThousand(dashboard.lifetimeAggregates.totalEngagement, dashboard.lifetimeAggregates.totalViews),
    description: () => "Normalizado",
  },
  {
    label: "Comentários atuais",
    value: (dashboard: DashboardPayload) => formatCompactNumber(dashboard.lifetimeAggregates.totalComments),
    description: () => "Base pública",
  },
  {
    label: "Compartilhamentos atuais",
    value: (dashboard: DashboardPayload) => formatCompactNumber(dashboard.lifetimeAggregates.totalShares),
    description: () => "Base pública",
  },
  {
    label: "Salvos atuais",
    value: (dashboard: DashboardPayload) => formatCompactNumber(dashboard.lifetimeAggregates.totalSaves),
    description: () => "Base pública",
  },
  {
    label: "Posts públicos mapeados",
    value: (dashboard: DashboardPayload) => formatCompactNumber(dashboard.lifetimeAggregates.postsCount),
    description: () => "Coleta atual",
  },
] as const;

export function MetricGrid({ dashboard }: MetricGridProps) {
  const metrics = hasPeriodHistory(dashboard) ? periodMetrics : baselineMetrics;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => (
        <Card key={metric.label} className="group relative overflow-visible">
          <CardHeader className="gap-3 pb-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{metric.label}</p>
              <button
                type="button"
                aria-label={`Ver detalhes de ${metric.label}`}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <CircleHelp className="size-3.5" />
              </button>
            </div>
            <CardTitle className="metric-value">{metric.value(dashboard)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div
              role="tooltip"
              className="pointer-events-none invisible absolute left-4 right-4 top-full z-20 mt-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground opacity-0 shadow-lg transition-[opacity,visibility] duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
            >
              {metric.description(dashboard)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
