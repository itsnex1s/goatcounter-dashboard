import { useEffect, useState } from "react";
import { api, ApiError } from "@/api";
import type { HitList, HitStat, Range, StatsPage, TotalResponse } from "@/types";

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
];

interface State {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}

export function useDashboard(range: Range): State {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));

    Promise.all([
      api.total(range),
      api.hits(range),
      ...METRICS.map((m) => api.page(m.page, range)),
    ])
      .then(([total, hits, ...metricRes]) => {
        if (!alive) return;
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
  }, [range]);

  return state;
}
