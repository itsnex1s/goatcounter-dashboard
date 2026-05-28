import { Card, CardContent } from "@/components/ui/card";
import { fmt, labelDay } from "@/lib/format";
import type { TotalResponse } from "@/types";

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

export function KpiTiles({ total }: { total: TotalResponse }) {
  const days = total.stats.length || 1;
  const busiest = total.stats.reduce(
    (best, s) => (s.daily > best.daily ? s : best),
    total.stats[0] ?? { day: "", daily: 0, hourly: [] },
  );
  const avg = Math.round(total.total / days);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Tile label="Pageviews" value={fmt(total.total)} />
      <Tile label="Events" value={fmt(total.total_events)} />
      <Tile label="Daily average" value={fmt(avg)} />
      <Tile
        label="Busiest day"
        value={busiest.daily ? labelDay(busiest.day) : "—"}
      />
    </div>
  );
}
