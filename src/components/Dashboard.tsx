import { lazy, Suspense, useMemo, useState } from "react";
import type { Connection } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Header } from "@/components/Header";
import { KpiTiles } from "@/components/KpiTiles";
import { MetricTable } from "@/components/MetricTable";
import { RefsDialog, type SelectedPage } from "@/components/RefsDialog";
import { useDashboard } from "@/hooks/useDashboard";
import { flag, lastDays, SIZE_LABELS } from "@/lib/format";
import type { HitStat } from "@/types";

const PageviewsChart = lazy(() => import("@/components/PageviewsChart"));
const WorldMap = lazy(() => import("@/components/WorldMap"));

interface Props {
  conn: Connection;
  connections: Connection[];
  onSwitch: (id: string) => void;
  onAdd: () => void;
  onRemove: () => void;
}

export function Dashboard({
  conn,
  connections,
  onSwitch,
  onAdd,
  onRemove,
}: Props) {
  const [days, setDays] = useState("7");
  const range = useMemo(() => lastDays(Number(days)), [days]);
  const { data, loading, error } = useDashboard(conn, range);
  const [selected, setSelected] = useState<SelectedPage | null>(null);

  const topPages: HitStat[] = useMemo(
    () =>
      data
        ? data.pages.map((p) => ({
            id: String(p.path_id),
            name: p.title || p.path,
            count: p.count,
          }))
        : [],
    [data],
  );
  const countries = useMemo(
    () => data?.metrics.find((m) => m.page === "locations")?.rows ?? [],
    [data],
  );

  return (
    <div className="min-h-screen">
      <Header
        connections={connections}
        activeId={conn.id}
        onSwitch={onSwitch}
        onAdd={onAdd}
        onRemove={onRemove}
        days={days}
        onDaysChange={setDays}
      />
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        {error ? (
          <Card>
            <CardContent className="space-y-3 pt-6 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" onClick={onRemove}>
                Reconnect
              </Button>
            </CardContent>
          </Card>
        ) : loading || !data ? (
          <LoadingState />
        ) : (
          <>
            <KpiTiles total={data.total} />
            <Card>
              <CardHeader>
                <CardTitle>Pageviews</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-[280px] w-full" />}>
                  <PageviewsChart total={data.total} />
                </Suspense>
              </CardContent>
            </Card>
            {countries.some((c) => c.count > 0) && (
              <ErrorBoundary>
                <Card>
                  <CardHeader>
                    <CardTitle>Countries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Suspense
                      fallback={<Skeleton className="h-[320px] w-full" />}
                    >
                      <WorldMap rows={countries} />
                    </Suspense>
                  </CardContent>
                </Card>
              </ErrorBoundary>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <MetricTable
                title="Top pages"
                rows={topPages}
                total={data.total.total_utc}
                onRowClick={(r) =>
                  setSelected({
                    pathId: Number(r.id),
                    name: r.name,
                    count: r.count,
                  })
                }
              />
              {data.metrics
                .filter((m) => m.rows.length > 0)
                .map((m) => (
                  <MetricTable
                    key={m.page}
                    title={m.title}
                    rows={
                      m.page === "sizes"
                        ? m.rows.map((r) => ({
                            ...r,
                            name: SIZE_LABELS[r.id ?? ""] ?? r.name,
                          }))
                        : m.rows
                    }
                    total={data.total.total_utc}
                    prefix={
                      m.page === "locations"
                        ? (r) => flag(r.id || r.name)
                        : undefined
                    }
                  />
                ))}
            </div>
          </>
        )}
      </main>
      <RefsDialog
        conn={conn}
        range={range}
        page={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px]" />
        ))}
      </div>
      <Skeleton className="h-[340px]" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[260px]" />
        ))}
      </div>
    </>
  );
}
