// Response shapes mirror GoatCounter's /api/v0 handlers (verified against source).

/** One day of the overall/per-page time series. */
export interface HitListStat {
  day: string; // YYYY-MM-DD
  hourly: number[]; // 24 values
  daily: number;
  weekly?: number;
  monthly?: number;
}

/** A single path in the top-pages list. */
export interface HitList {
  count: number;
  path_id: number;
  path: string;
  event: boolean;
  title: string;
  max: number;
  stats: HitListStat[];
  ref_scheme?: string | null;
}

/** A row in a metric table (browsers, systems, locations, refs, ...). */
export interface HitStat {
  id?: string;
  name: string;
  count: number;
  ref_scheme?: string | null;
}

export interface TotalResponse {
  total: number;
  total_events: number;
  total_utc: number;
  stats: HitListStat[];
}

export interface HitsResponse {
  hits: HitList[];
  total: number;
  more: boolean;
}

export interface StatsResponse {
  stats: HitStat[];
  more: boolean;
}

export interface RefsResponse {
  refs: HitStat[];
  more: boolean;
}

/** /api/v0/me — only the fields we use. */
export interface MeResponse {
  site?: { id?: number; code?: string; cname?: string };
  user?: { email?: string };
}

/** The metric pages /api/v0/stats/{page} accepts. */
export type StatsPage =
  | "toprefs"
  | "browsers"
  | "systems"
  | "locations"
  | "sizes"
  | "languages"
  | "campaigns";

export interface Range {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}
