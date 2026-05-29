import type {
  HitsResponse,
  MeResponse,
  Range,
  RefsResponse,
  StatsPage,
  StatsResponse,
  TotalResponse,
} from "@/types";

export interface Creds {
  url: string;
  token: string;
}

/** A saved GoatCounter connection — lets the dashboard switch between sites. */
export interface Connection extends Creds {
  id: string;
  label: string;
}

const CONNS = "gcd_conns";
const ACTIVE = "gcd_active";

export function hostLabel(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url || "GoatCounter";
  }
}

// One-time migration from the original single-connection keys.
function migrate() {
  if (localStorage.getItem(CONNS)) return;
  const url = localStorage.getItem("gcd_url");
  const token = localStorage.getItem("gcd_token");
  if (url && token) {
    const c: Connection = { id: crypto.randomUUID(), label: hostLabel(url), url, token };
    localStorage.setItem(CONNS, JSON.stringify([c]));
    localStorage.setItem(ACTIVE, c.id);
  }
  localStorage.removeItem("gcd_url");
  localStorage.removeItem("gcd_token");
}

export function listConnections(): Connection[] {
  migrate();
  try {
    return JSON.parse(localStorage.getItem(CONNS) || "[]") as Connection[];
  } catch {
    return [];
  }
}

export function activeConnection(): Connection | null {
  const list = listConnections();
  const id = localStorage.getItem(ACTIVE);
  return list.find((c) => c.id === id) ?? list[0] ?? null;
}

export function setActive(id: string) {
  localStorage.setItem(ACTIVE, id);
}

export function addConnection(c: Creds & { label?: string }): Connection {
  const url = c.url.replace(/\/+$/, "");
  const conn: Connection = {
    id: crypto.randomUUID(),
    label: c.label?.trim() || hostLabel(url),
    url,
    token: c.token,
  };
  const list = listConnections();
  list.push(conn);
  localStorage.setItem(CONNS, JSON.stringify(list));
  localStorage.setItem(ACTIVE, conn.id);
  return conn;
}

export function removeConnection(id: string) {
  const list = listConnections().filter((c) => c.id !== id);
  localStorage.setItem(CONNS, JSON.stringify(list));
  if (localStorage.getItem(ACTIVE) === id) {
    if (list[0]) localStorage.setItem(ACTIVE, list[0].id);
    else localStorage.removeItem(ACTIVE);
  }
  sessionStorage.clear();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function query(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Opts {
  creds?: Creds | null;
  // Retries for GoatCounter's strict 4 req/s API limit. A 429 surfaces as a
  // readable response same-origin, but as a thrown "failed to fetch" when a
  // cross-origin CORS preflight is itself rate-limited — so we retry both.
  retries?: number;
}

// GET with Bearer auth + a per-session response cache. GoatCounter rollups are
// immutable for past hours, so caching by full URL is safe within a session.
async function get<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  { creds = activeConnection(), retries = 0 }: Opts = {},
): Promise<T> {
  if (!creds) throw new ApiError(401, "Not configured");
  const endpoint = `${creds.url}/api/v0${path}${query(params)}`;
  const cached = sessionStorage.getItem(endpoint);
  if (cached) return JSON.parse(cached) as T;

  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${creds.token}` },
      });
    } catch {
      if (attempt < retries) {
        await sleep(700 * (attempt + 1));
        continue;
      }
      throw new ApiError(0, "Network or CORS error — is the URL right and reachable?");
    }
    if (res.status === 429 && attempt < retries) {
      const retryAfter = Number(res.headers.get("Retry-After")) || 1;
      await sleep(retryAfter * 1000 + 100);
      continue;
    }
    if (!res.ok) {
      throw new ApiError(
        res.status,
        res.status === 401 || res.status === 403
          ? "Invalid API token"
          : `Request failed (${res.status})`,
      );
    }
    const data = (await res.json()) as T;
    try {
      sessionStorage.setItem(endpoint, JSON.stringify(data));
    } catch {
      // sessionStorage full — fine, just skip caching.
    }
    return data;
  }
}

const RETRIES = 5;

export const api = {
  me: (creds?: Creds) => get<MeResponse>("/me", {}, { creds }),
  total: (r: Range, creds?: Creds) =>
    get<TotalResponse>("/stats/total", { ...r }, { creds, retries: RETRIES }),
  hits: (r: Range, creds?: Creds, limit = 12) =>
    get<HitsResponse>("/stats/hits", { ...r, limit }, { creds, retries: RETRIES }),
  page: (page: StatsPage, r: Range, creds?: Creds, limit = 9) =>
    get<StatsResponse>(`/stats/${page}`, { ...r, limit }, { creds, retries: RETRIES }),
  refs: (pathId: number, r: Range, creds?: Creds, limit = 9) =>
    get<RefsResponse>(`/stats/hits/${pathId}`, { ...r, limit }, { creds, retries: RETRIES }),
};
