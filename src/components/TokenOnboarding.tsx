import { type FormEvent, useState } from "react";
import { Goal } from "lucide-react";
import { api, ApiError, setCreds } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function TokenOnboarding({ onReady }: { onReady: () => void }) {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const creds = { url: url.trim().replace(/\/+$/, ""), token: token.trim() };
    try {
      await api.me(creds); // validate before persisting
      setCreds(creds);
      onReady();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not connect");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="mb-6 flex items-center gap-2">
            <Goal className="h-5 w-5" />
            <h1 className="text-lg font-semibold">GoatCounter Dashboard</h1>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="url" className="text-sm font-medium">
                Instance URL
              </label>
              <Input
                id="url"
                type="url"
                required
                autoComplete="off"
                placeholder="https://stats.example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="token" className="text-sm font-medium">
                API token
              </label>
              <Input
                id="token"
                type="password"
                required
                autoComplete="off"
                placeholder="GoatCounter → Settings → API"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Connecting…" : "Connect"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Stored only in this browser. Requests go directly to your
              GoatCounter instance — nowhere else.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
