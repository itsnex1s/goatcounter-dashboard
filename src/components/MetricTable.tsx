import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fmt, pct, ratio } from "@/lib/format";
import type { HitStat } from "@/types";

interface Props {
  title: string;
  rows: HitStat[];
  total: number;
  /** Optional leading glyph per row (e.g. a country flag). */
  prefix?: (row: HitStat) => string;
}

export function MetricTable({ title, rows, total, prefix }: Props) {
  const visible = rows.filter((r) => r.count > 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {visible.length === 0 && (
          <p className="text-sm text-muted-foreground">No data</p>
        )}
        {visible.map((row, i) => (
          <div key={row.id ?? row.name ?? i} className="relative">
            <div
              className="absolute inset-y-0 left-0 rounded-sm bg-accent"
              style={{ width: `${ratio(row.count, total)}%` }}
            />
            <div className="relative flex items-center justify-between px-2 py-1 text-sm">
              <span className="truncate pr-3">
                {prefix && <span className="mr-1.5">{prefix(row)}</span>}
                {row.name || "(none)"}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {fmt(row.count)}
                <span className="ml-2 hidden sm:inline">
                  {pct(row.count, total)}
                </span>
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
