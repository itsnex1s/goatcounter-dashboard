import type { Range } from "@/types";

const nf = new Intl.NumberFormat();
export const fmt = (n: number) => nf.format(n);

export const pct = (n: number, total: number) =>
  total > 0 ? `${((n / total) * 100).toFixed(1)}%` : "0%";

/** ISO 3166-1 alpha-2 → flag emoji via regional indicator symbols. */
export function flag(code?: string): string {
  if (!code || code.length !== 2 || !/^[A-Za-z]{2}$/.test(code)) return "🏳️";
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

const DAY = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Last N days, inclusive of today, as YYYY-MM-DD. */
export function lastDays(days: number): Range {
  const now = Date.now();
  return { start: iso(new Date(now - (days - 1) * DAY)), end: iso(new Date(now)) };
}

export const RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
] as const;

export const labelDay = (day: string) =>
  new Date(day + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
