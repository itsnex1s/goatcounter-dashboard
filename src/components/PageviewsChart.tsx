import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmt, labelDay } from "@/lib/format";
import type { TotalResponse } from "@/types";

const COLOR = "#3b82f6";

// Default export so it can be code-split via React.lazy (keeps Recharts —
// the heaviest dependency — out of the initial bundle).
export default function PageviewsChart({ total }: { total: TotalResponse }) {
  const data = total.stats.map((s) => ({ day: s.day, v: s.daily }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLOR} stopOpacity={0.35} />
            <stop offset="100%" stopColor={COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          className="stroke-border"
        />
        <XAxis
          dataKey="day"
          tickFormatter={labelDay}
          tickLine={false}
          axisLine={false}
          minTickGap={32}
          className="text-xs fill-muted-foreground"
        />
        <YAxis
          width={36}
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          className="text-xs fill-muted-foreground"
        />
        <Tooltip
          cursor={{ stroke: COLOR, strokeOpacity: 0.3 }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
                <div className="font-medium">{labelDay(String(label))}</div>
                <div className="text-muted-foreground">
                  {fmt(Number(payload[0].value))} pageviews
                </div>
              </div>
            ) : null
          }
        />
        <Area
          type="monotone"
          dataKey="v"
          stroke={COLOR}
          strokeWidth={2}
          fill="url(#fill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
