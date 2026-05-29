import { Goal, LogOut, Plus } from "lucide-react";
import type { Connection } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RANGES } from "@/lib/format";

interface Props {
  connections: Connection[];
  activeId: string;
  onSwitch: (id: string) => void;
  onAdd: () => void;
  onRemove: () => void;
  days: string;
  onDaysChange: (v: string) => void;
}

export function Header({
  connections,
  activeId,
  onSwitch,
  onAdd,
  onRemove,
  days,
  onDaysChange,
}: Props) {
  const active = connections.find((c) => c.id === activeId);

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Goal className="h-5 w-5 shrink-0" />
        {connections.length > 1 ? (
          <Select value={activeId} onValueChange={onSwitch}>
            <SelectTrigger className="max-w-[220px] font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {connections.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="truncate font-semibold">{active?.label}</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Select value={days} onValueChange={onDaysChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={onAdd}
            aria-label="Add connection"
          >
            <Plus />
          </Button>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label="Remove this connection"
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  );
}
