import type {
  HitsResponse,
  MeResponse,
  Range,
  RefsResponse,
  StatsPage,
  StatsResponse,
  TotalResponse,
} from "@/types";

const URL_KEY = "gcd_url";
const TOKEN_KEY = "gcd_token";

export interface Creds {
  url: string;
  token: string;
}

export function getCreds(): Creds | null {
  const url = localStorage.getItem(URL_KEY);
  const token = localStorage.getItem(TOKEN_KEY);
  return url && token ? { url, token } : null;
}

export function setCreds(c: Creds) {
  localStorage.setItem(URL_KEY, c.url.replace(/\/+$/, ""));
  localStorage.setItem(TOKEN_KEY, c.token);
}

export function clearCreds() {
  localStorage.removeItem(URL_KEY);
  localStorage.removeItem(TOKEN_KEY);
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
  { creds = getCreds(), retries = 0 }: Opts = {},
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
  total: (r: Range) => get<TotalResponse>("/stats/total", { ...r }, { retries: RETRIES }),
  hits: (r: Range, limit = 12) =>
    get<HitsResponse>("/stats/hits", { ...r, limit }, { retries: RETRIES }),
  page: (page: StatsPage, r: Range, limit = 9) =>
    get<StatsResponse>(`/stats/${page}`, { ...r, limit }, { retries: RETRIES }),
  refs: (pathId: number, r: Range, limit = 9) =>
    get<RefsResponse>(`/stats/hits/${pathId}`, { ...r, limit }, { retries: RETRIES }),
};
