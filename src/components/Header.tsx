import { Goal, LogOut } from "lucide-react";
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
  site: string;
  days: string;
  onDaysChange: (v: string) => void;
  onDisconnect: () => void;
}

export function Header({ site, days, onDaysChange, onDisconnect }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Goal className="h-5 w-5 shrink-0" />
        <span className="truncate font-semibold">{site}</span>
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
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={onDisconnect}
            aria-label="Disconnect"
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  );
}
