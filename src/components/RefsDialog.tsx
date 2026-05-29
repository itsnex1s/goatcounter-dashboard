import { useEffect, useState } from "react";
import { api, ApiError, type Connection } from "@/api";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { fmt, pct, ratio } from "@/lib/format";
import type { HitStat, Range } from "@/types";

export interface SelectedPage {
  pathId: number;
  name: string;
  count: number;
}

export function RefsDialog({
  conn,
  range,
  page,
  onClose,
}: {
  conn: Connection;
  range: Range;
  page: SelectedPage | null;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<HitStat[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!page) return;
    setRows(null);
    setError(null);
    let alive = true;
    api
      .refs(page.pathId, range, conn)
      .then((r) => alive && setRows(r.refs))
      .catch(
        (e: unknown) =>
          alive &&
          setError(e instanceof ApiError ? e.message : "Failed to load"),
      );
    return () => {
      alive = false;
    };
  }, [page, range, conn]);

  const visible = (rows ?? []).filter((r) => r.count > 0);

  return (
    <Dialog open={!!page} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>Referrers</DialogTitle>
        <p className="-mt-2 truncate text-sm text-muted-foreground">
          {page?.name}
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!rows && !error && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-7" />
            ))}
          </div>
        )}
        {rows && visible.length === 0 && (
          <p className="text-sm text-muted-foreground">No referrers</p>
        )}
        {visible.length > 0 && (
          <div className="max-h-[60vh] space-y-2 overflow-auto">
            {visible.map((row, i) => (
              <div key={row.id ?? row.name ?? i} className="relative">
                <div
                  className="absolute inset-y-0 left-0 rounded-sm bg-accent"
                  style={{ width: `${ratio(row.count, page?.count ?? 0)}%` }}
                />
                <div className="relative flex items-center justify-between px-2 py-1 text-sm">
                  <span className="truncate pr-3">{row.name || "(none)"}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {fmt(row.count)}
                    <span className="ml-2">{pct(row.count, page?.count ?? 0)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
