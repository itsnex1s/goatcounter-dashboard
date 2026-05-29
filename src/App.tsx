import { useCallback, useState } from "react";
import {
  activeConnection,
  listConnections,
  removeConnection,
  setActive,
} from "@/api";
import { Dashboard } from "@/components/Dashboard";
import { TokenOnboarding } from "@/components/TokenOnboarding";

export default function App() {
  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((n) => n + 1), []);
  const [adding, setAdding] = useState(false);

  const connections = listConnections();
  const active = activeConnection();

  if (!active || adding) {
    return (
      <TokenOnboarding
        canCancel={!!active}
        onCancel={() => setAdding(false)}
        onReady={() => {
          setAdding(false);
          refresh();
        }}
      />
    );
  }

  return (
    <Dashboard
      conn={active}
      connections={connections}
      onSwitch={(id) => {
        setActive(id);
        refresh();
      }}
      onAdd={() => setAdding(true)}
      onRemove={() => {
        removeConnection(active.id);
        refresh();
      }}
    />
  );
}
