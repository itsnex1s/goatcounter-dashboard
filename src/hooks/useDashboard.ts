import { useEffect, useState } from "react";
import { api, ApiError, type Connection } from "@/api";
import type {
  HitList,
  HitsResponse,
  HitStat,
  Range,
  StatsPage,
  StatsResponse,
  TotalResponse,
} from "@/types";

export interface MetricGroup {
  page: StatsPage;
  title: string;
  rows: HitStat[];
}

export interface DashboardData {
  total: TotalResponse;
  pages: HitList[];
  metrics: MetricGroup[];
}

const METRICS: { page: StatsPage; title: string }[] = [
  { page: "toprefs", title: "Referrers" },
  { page: "browsers", title: "Browsers" },
  { page: "systems", title: "Operating systems" },
  { page: "locations", title: "Countries" },
  { page: "sizes", title: "Screen sizes" },
  { page: "languages", title: "Languages" },
  { page: "campaigns", title: "Campaigns" },
];

interface State {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}

// Run tasks with bounded concurrency to stay friendly to GoatCounter's API
// rate limit (4 req/s by default); each task still retries on 429 internally.
async function pool<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results = new Array<T>(tasks.length);
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, worker),
  );
  return results;
}

export function useDashboard(conn: Connection, range: Range): State {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));

    const tasks: Array<
      () => Promise<TotalResponse | HitsResponse | StatsResponse>
    > = [
      () => api.total(range, conn),
      () => api.hits(range, conn),
      ...METRICS.map((m) => () => api.page(m.page, range, conn)),
    ];

    pool(tasks, 4)
      .then((results) => {
        if (!alive) return;
        const total = results[0] as TotalResponse;
        const hits = results[1] as HitsResponse;
        const metricRes = results.slice(2) as StatsResponse[];
        setState({
          loading: false,
          error: null,
          data: {
            total,
            pages: hits.hits,
            metrics: METRICS.map((m, i) => ({
              page: m.page,
              title: m.title,
              rows: metricRes[i].stats,
            })),
          },
        });
      })
      .catch((e: unknown) => {
        if (!alive) return;
        const msg =
          e instanceof ApiError ? e.message : "Failed to load stats";
        setState({ data: null, loading: false, error: msg });
      });

    return () => {
      alive = false;
    };
  }, [conn, range]);

  return state;
}
