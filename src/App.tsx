import { useState } from "react";
import { clearCreds, getCreds } from "@/api";
import { Dashboard } from "@/components/Dashboard";
import { TokenOnboarding } from "@/components/TokenOnboarding";

function siteLabel(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "GoatCounter";
  }
}

export default function App() {
  const [creds, setCredsState] = useState(getCreds);

  if (!creds) {
    return <TokenOnboarding onReady={() => setCredsState(getCreds())} />;
  }

  return (
    <Dashboard
      site={siteLabel(creds.url)}
      onDisconnect={() => {
        clearCreds();
        setCredsState(null);
      }}
    />
  );
}
