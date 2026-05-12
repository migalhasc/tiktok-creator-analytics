import { type DashboardPayload, type SortKey } from "@shared/domain";
import { cn } from "@/lib/utils";

type DashboardFiltersProps = {
  dashboard: DashboardPayload;
  activeSort: SortKey;
  isPending?: boolean;
  onSortChange: (sort: SortKey) => void;
};

const studioLikeSorts: Array<{ key: SortKey; label: string }> = [
  { key: "best", label: "Melhores posts" },
  { key: "viewed", label: "Mais vistos" },
  { key: "liked", label: "Mais curtidos" },
  { key: "commented", label: "Mais comentados" },
  { key: "shared", label: "Mais compartilhados" },
  { key: "saved", label: "Mais salvos" },
];

export function DashboardFilters({ dashboard, activeSort, isPending = false, onSortChange }: DashboardFiltersProps) {
  const visibleSorts = studioLikeSorts.filter((item) => item.key === "best" || dashboard.filterAvailability[item.key].enabled);

  return (
    <div className="flex flex-wrap gap-2">
      {visibleSorts.map((sort) => (
        <button
          key={sort.key}
          type="button"
          disabled={isPending}
          onClick={() => onSortChange(sort.key)}
          className={cn(
            "rounded-md border px-3 py-2 text-sm transition-colors",
            activeSort === sort.key
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:bg-muted",
            isPending && "cursor-not-allowed opacity-60",
          )}
        >
          {sort.label}
        </button>
      ))}
    </div>
  );
}
