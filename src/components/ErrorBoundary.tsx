import { Component, type ReactNode } from "react";

// Isolates an optional widget (e.g. the lazy map) so a render failure degrades
// to the fallback instead of taking down the whole dashboard.
export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
