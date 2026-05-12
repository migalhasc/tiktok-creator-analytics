import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  defaultRange,
  defaultSort,
  isSearchRange,
  isSortKey,
  rangeLabels,
  searchRangeValues,
  type DashboardPayload,
  type SortKey,
} from "@shared/domain";
import { normalizeProfileInput } from "@shared/profile-input";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { DiagnosticsPanel } from "@/components/dashboard/diagnostics-panel";
import { MetricGrid } from "@/components/dashboard/metric-grid";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { PostsList } from "@/components/dashboard/posts-list";
import { hasPeriodHistory } from "@/lib/dashboard";
import { SearchForm } from "@/components/search/search-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompactNumber, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { dashboardQueryKey, dashboardQueryPrefix, trpcClient } from "@/lib/trpc";

const publicSortPreference: SortKey[] = ["best", "viewed", "liked", "commented", "shared", "saved"];

function resolvePublicSorts(dashboard: DashboardPayload) {
  return publicSortPreference.filter((sortKey) => sortKey === "best" || dashboard.filterAvailability[sortKey].enabled);
}

function PendingProfileShell(props: {
  username: string;
  searchValue: string;
  isPending: boolean;
  errorMessage: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="space-y-6 px-6 py-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-full border border-border bg-muted text-lg font-semibold">
              {props.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">@{props.username}</h1>
              <p className="section-subtitle">Carregando dados.</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm text-foreground">
            Coletando posts e métricas.
          </div>

          <SearchForm
            value={props.searchValue}
            onChange={props.onChange}
            onSubmit={props.onSubmit}
            isPending={props.isPending}
            errorMessage={props.errorMessage}
            submitLabel="Buscar outro perfil"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </CardContent>
      </Card>
    </div>
  );
}

export function ProfilePage() {
  const { username: routeUsername } = useParams();
  const navigate = useNavigate();
  const reactQueryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isPendingTransition, startTransition] = useTransition();
  const autoRefreshKeyRef = useRef<string | null>(null);
  const rangeParam = searchParams.get("range");
  const sortParam = searchParams.get("sort");

  const range = isSearchRange(rangeParam) ? rangeParam : defaultRange;
  const sort = isSortKey(sortParam) ? sortParam : defaultSort;

  const username = useMemo(() => {
    if (!routeUsername) return null;
    try {
      return normalizeProfileInput(routeUsername).username;
    } catch {
      return null;
    }
  }, [routeUsername]);

  useEffect(() => {
    if (!routeUsername || !username) {
      navigate("/", { replace: true });
      return;
    }

    if (rangeParam !== range || sortParam !== sort) {
      setSearchParams({ range, sort }, { replace: true });
    }
  }, [navigate, range, rangeParam, routeUsername, setSearchParams, sort, sortParam, username]);

  const dashboardQuery = useQuery({
    queryKey: username ? dashboardQueryKey(username, range, sort) : ["dashboard", "missing"],
    enabled: Boolean(username),
    refetchInterval: (query) => {
      const payload = query.state.data as DashboardPayload | undefined;
      return payload?.cacheStatus === "refreshing" ? 2_000 : false;
    },
    queryFn: () =>
      trpcClient.getProfileDashboard.query({
        username: username!,
        range,
        sort,
      }),
  });

  const refreshMutation = useMutation({
    mutationFn: async ({ profileUsername, force = false }: { profileUsername: string; silent?: boolean; force?: boolean }) =>
      trpcClient.refreshProfile.mutate({
        username: profileUsername,
        force,
      }),
    onSuccess: async (dashboard, variables) => {
      reactQueryClient.setQueriesData<DashboardPayload>({ queryKey: dashboardQueryPrefix(variables.profileUsername) }, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          profile: dashboard.profile,
          filterAvailability: dashboard.filterAvailability,
          lifetimeAggregates: dashboard.lifetimeAggregates,
          cacheStatus: dashboard.cacheStatus,
          lastUpdatedAt: dashboard.lastUpdatedAt,
          needsRefresh: dashboard.needsRefresh,
          errorMessage: dashboard.errorMessage,
        };
      });

      await reactQueryClient.refetchQueries({ queryKey: dashboardQueryPrefix(variables.profileUsername), type: "active" });
      if (!variables.silent) {
        toast.success(dashboard.cacheStatus === "refreshing" ? "Atualização iniciada." : "Dados atualizados com sucesso.");
      }
    },
    onError: (error, variables) => {
      if (!variables.silent) {
        toast.error(error.message);
      }
    },
  });

  function handleSearchSubmit() {
    try {
      const normalized = normalizeProfileInput(searchValue);
      setSearchError(null);
      setSearchValue("");
      startTransition(() => {
        navigate(`/perfil/${normalized.username}?range=${defaultRange}&sort=${defaultSort}`);
      });
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Use um username simples ou o link público do perfil.");
    }
  }

  useEffect(() => {
    const dashboard = dashboardQuery.data;
    if (!dashboard || !username) return;
    if (!dashboard.needsRefresh) return;
    if (dashboard.cacheStatus === "refreshing") return;

    const autoRefreshKey = `${username}:${dashboard.cacheStatus}:${dashboard.lastUpdatedAt ?? "never"}`;
    if (autoRefreshKeyRef.current === autoRefreshKey) return;

    autoRefreshKeyRef.current = autoRefreshKey;
    refreshMutation.mutate({ profileUsername: username, silent: true, force: false });
  }, [dashboardQuery.data, refreshMutation, username]);

  useEffect(() => {
    const dashboard = dashboardQuery.data;
    if (!dashboard) return;

    const visibleSorts = resolvePublicSorts(dashboard);
    if (!visibleSorts.includes(sort)) {
      setSearchParams({ range, sort: defaultSort }, { replace: true });
    }
  }, [dashboardQuery.data, range, setSearchParams, sort]);

  if (dashboardQuery.isPending && !dashboardQuery.data && username) {
    return (
      <PendingProfileShell
        username={username}
        searchValue={searchValue}
        isPending={isPendingTransition}
        errorMessage={searchError}
        onChange={(value) => {
          setSearchValue(value);
          if (searchError) {
            setSearchError(null);
          }
        }}
        onSubmit={handleSearchSubmit}
      />
    );
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="size-5" />
            <CardTitle>Não foi possível carregar o dashboard.</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {dashboardQuery.error?.message ?? "O serviço está temporariamente indisponível. Tente novamente em instantes."}
          </p>
          <Button onClick={() => dashboardQuery.refetch()}>Tentar novamente</Button>
        </CardContent>
      </Card>
    );
  }

  const dashboard = dashboardQuery.data;
  const isInitialCollection = dashboard.cacheStatus === "refreshing" && dashboard.posts.length === 0;
  const periodHistoryReady = hasPeriodHistory(dashboard);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="space-y-6 px-6 py-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {dashboard.profile.avatarUrl ? (
                  <img
                    src={dashboard.profile.avatarUrl}
                    alt={dashboard.profile.displayName ?? dashboard.profile.username}
                    className="size-14 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="flex size-14 items-center justify-center rounded-full border border-border bg-muted text-lg font-semibold">
                    {dashboard.profile.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {dashboard.profile.displayName || `@${dashboard.profile.username}`}
                  </h2>
                  <p className="section-subtitle">@{dashboard.profile.username}</p>
                </div>
              </div>

              {dashboard.profile.biography ? <p className="max-w-3xl text-sm text-muted-foreground">{dashboard.profile.biography}</p> : null}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>Seguidores: {formatCompactNumber(dashboard.profile.followers)}</span>
                <span>Seguindo: {formatCompactNumber(dashboard.profile.following)}</span>
                <span>Curtidas do perfil: {formatCompactNumber(dashboard.profile.likes)}</span>
                <span>Vídeos públicos: {formatCompactNumber(dashboard.profile.videosCount)}</span>
                <span>Última atualização: {formatDateTime(dashboard.lastUpdatedAt)}</span>
              </div>
            </div>

            <div className="flex min-w-[260px] flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {searchRangeValues.map((rangeOption) => (
                  <button
                    key={rangeOption}
                    type="button"
                    disabled={dashboardQuery.isFetching || isPendingTransition}
                    onClick={() =>
                      startTransition(() => {
                        setSearchParams({ range: rangeOption, sort });
                      })
                    }
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm transition-colors",
                      range === rangeOption
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:bg-muted",
                      (dashboardQuery.isFetching || isPendingTransition) && "cursor-not-allowed opacity-60",
                    )}
                  >
                    {rangeLabels[rangeOption]}
                  </button>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => refreshMutation.mutate({ profileUsername: dashboard.profile.username, force: true })}
                disabled={refreshMutation.isPending || dashboard.cacheStatus === "refreshing"}
              >
                <RefreshCcw
                  className={`mr-2 size-4 ${(refreshMutation.isPending || dashboard.cacheStatus === "refreshing") ? "animate-spin" : ""}`}
                />
                Atualizar agora
              </Button>

              <a
                href={dashboard.profile.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
              >
                Abrir perfil
              </a>
            </div>
          </div>

          <SearchForm
            value={searchValue}
            onChange={(value) => {
              setSearchValue(value);
              if (searchError) {
                setSearchError(null);
              }
            }}
            onSubmit={handleSearchSubmit}
            isPending={isPendingTransition}
            errorMessage={searchError}
            submitLabel="Buscar outro perfil"
          />

          {dashboard.errorMessage ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {dashboard.errorMessage}
            </div>
          ) : null}

          {dashboard.cacheStatus === "refreshing" ? (
            <div className="rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm text-foreground">
              {isInitialCollection ? "Primeira coleta em andamento." : "Atualizando dados."}
            </div>
          ) : dashboard.needsRefresh ? (
            <div className="rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm text-foreground">
              Cache exibido. Atualizando em segundo plano.
            </div>
          ) : null}

          {!periodHistoryReady ? (
            <div className="rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm text-foreground">
              Histórico diário em formação.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <MetricGrid dashboard={dashboard} />

      <OverviewChart dashboard={dashboard} />

      <DiagnosticsPanel dashboard={dashboard} />

      <Card>
        <CardContent className="space-y-6 px-6 py-6">
          <h2 className="section-heading">Ordenação</h2>

          <DashboardFilters
            dashboard={dashboard}
            activeSort={sort}
            isPending={isPendingTransition || dashboardQuery.isFetching}
            onSortChange={(nextSort) =>
              startTransition(() => {
                setSearchParams({ range, sort: nextSort });
              })
            }
          />
        </CardContent>
      </Card>

      <PostsList dashboard={dashboard} />
    </div>
  );
}
