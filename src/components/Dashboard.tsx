import { lazy, Suspense, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/Header";
import { KpiTiles } from "@/components/KpiTiles";
import { MetricTable } from "@/components/MetricTable";
import { useDashboard } from "@/hooks/useDashboard";
import { flag, lastDays } from "@/lib/format";
import type { HitStat } from "@/types";

const PageviewsChart = lazy(() => import("@/components/PageviewsChart"));

export function Dashboard({
  site,
  onDisconnect,
}: {
  site: string;
  onDisconnect: () => void;
}) {
  const [days, setDays] = useState("7");
  const range = useMemo(() => lastDays(Number(days)), [days]);
  const { data, loading, error } = useDashboard(range);

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

  return (
    <div className="min-h-screen">
      <Header
        site={site}
        days={days}
        onDaysChange={setDays}
        onDisconnect={onDisconnect}
      />
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        {error ? (
          <Card>
            <CardContent className="space-y-3 pt-6 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" onClick={onDisconnect}>
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
            <div className="grid gap-4 md:grid-cols-2">
              <MetricTable
                title="Top pages"
                rows={topPages}
                total={data.total.total}
              />
              {data.metrics.map((m) => (
                <MetricTable
                  key={m.page}
                  title={m.title}
                  rows={m.rows}
                  total={data.total.total}
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
