import { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { fmt } from "@/lib/format";
import type { HitStat } from "@/types";

// GoatCounter country names → Natural Earth names used by the topojson.
const ALIAS: Record<string, string> = {
  "united states": "united states of america",
  "czech republic": "czechia",
  "democratic republic of the congo": "dem. rep. congo",
  "bosnia and herzegovina": "bosnia and herz.",
  "dominican republic": "dominican rep.",
  "central african republic": "central african rep.",
  "south sudan": "s. sudan",
  "equatorial guinea": "eq. guinea",
  "north macedonia": "macedonia",
};

const norm = (s: string) => s.toLowerCase().trim();

// Default export so it can be code-split via React.lazy (react-simple-maps +
// d3-geo are heavy and stay out of the initial bundle).
export default function WorldMap({ rows }: { rows: HitStat[] }) {
  const [hover, setHover] = useState<string | null>(null);

  const counts = new Map<string, number>();
  let max = 1;
  for (const r of rows) {
    const key = ALIAS[norm(r.name)] ?? norm(r.name);
    counts.set(key, r.count);
    if (r.count > max) max = r.count;
  }

  return (
    <div>
      <ComposableMap
        projectionConfig={{ scale: 145 }}
        width={800}
        height={380}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography="/countries-110m.json">
          {({ geographies }) =>
            geographies.map((geo) => {
              const name = String(geo.properties.name ?? "");
              const count = counts.get(norm(name)) ?? 0;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={() =>
                    setHover(count ? `${name} — ${fmt(count)}` : name)
                  }
                  onMouseLeave={() => setHover(null)}
                  style={{
                    default: {
                      fill: count
                        ? `rgba(59,130,246,${(0.25 + 0.75 * (count / max)).toFixed(3)})`
                        : "hsl(var(--muted))",
                      stroke: "hsl(var(--background))",
                      strokeWidth: 0.5,
                      outline: "none",
                    },
                    hover: {
                      fill: "#3b82f6",
                      stroke: "hsl(var(--background))",
                      strokeWidth: 0.5,
                      outline: "none",
                    },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
      <p className="h-5 text-center text-xs text-muted-foreground">{hover}</p>
    </div>
  );
}
