import type { DashboardPayload } from "@shared/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DiagnosticsPanelProps = {
  dashboard: DashboardPayload;
};

const categoryLabels = {
  growth: "Crescimento",
  efficiency: "Eficiência",
  trend: "Tendência",
  replication: "Replicação",
} as const;

export function DiagnosticsPanel({ dashboard }: DiagnosticsPanelProps) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>Diagnósticos</CardTitle>
      </CardHeader>
      <CardContent>
        {dashboard.diagnostics.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {dashboard.diagnostics.map((diagnostic) => (
              <div key={diagnostic.id} className="rounded-xl border border-border bg-card p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {categoryLabels[diagnostic.category]}
                </p>
                <p className="mt-2 text-sm text-foreground">{diagnostic.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            Sem sinais ainda.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
