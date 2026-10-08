import type { Dispatch, SetStateAction } from "react";
import type { AuthUser } from "@/lib/api";

export type WorkspaceView = "menu" | "orders";

const navItems: { view: WorkspaceView; label: string; icon: string }[] = [
  { view: "menu", label: "Menu & order", icon: "▦" },
  { view: "orders", label: "Orders", icon: "≡" },
];

export function Topbar({
  onRefresh,
  loading,
  user,
  onLogout,
}: {
  onRefresh: () => void;
  loading: boolean;
  user: AuthUser;
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-edge bg-canvas/85 px-4 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <span className="grid size-7 place-items-center rounded-md bg-accent font-mono text-sm font-bold text-canvas">
          R
        </span>
        <span className="text-sm font-semibold tracking-tight">Service Desk</span>
        <span className="label hidden sm:inline">/ Restaurant Ops</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden items-center gap-2 rounded-full border border-edge bg-surface px-2.5 py-1 md:flex">
          <span className="live-dot size-1.5 rounded-full bg-accent" />
          <span className="text-xs text-ink-muted">Live</span>
        </span>

        <div className="hidden text-right leading-tight sm:block">
          <p className="text-xs font-medium">{user.name}</p>
          <p className="label">{user.role}</p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-md border border-edge bg-raised px-2.5 py-1.5 text-xs font-medium transition hover:border-edge-strong hover:bg-edge disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span aria-hidden="true" className={loading ? "inline-block animate-spin" : undefined}>
            ↻
          </span>
          Refresh
        </button>

        <button
          onClick={onLogout}
          className="rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-raised hover:text-ink"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

export function Sidebar({
  activeView,
  setActiveView,
  orderCount,
  apiAddress,
}: {
  activeView: WorkspaceView;
  setActiveView: Dispatch<SetStateAction<WorkspaceView>>;
  orderCount: number;
  apiAddress: string;
}) {
  return (
    <nav className="hidden w-14 shrink-0 flex-col items-center gap-1 border-r border-edge py-3 md:flex">
      {navItems.map((item) => {
        const active = activeView === item.view;
        return (
          <button
            key={item.view}
            onClick={() => setActiveView(item.view)}
            aria-current={active ? "page" : undefined}
            title={item.label}
            className={`relative grid size-10 place-items-center rounded-lg text-lg transition ${
              active
                ? "bg-raised text-accent"
                : "text-ink-subtle hover:bg-surface hover:text-ink-muted"
            }`}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span className="sr-only">{item.label}</span>
            {item.view === "orders" && orderCount > 0 && (
              <span className="tnum absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-accent px-1 text-[10px] font-bold leading-4 text-canvas">
                {orderCount}
              </span>
            )}
          </button>
        );
      })}

      <div className="mt-auto px-1 pb-1 text-center">
        <p className="label text-[9px] leading-tight">API</p>
        <p className="tnum mt-0.5 text-[10px] text-ink-subtle">{apiAddress}</p>
      </div>
    </nav>
  );
}

export function PageHeading({
  activeView,
  setActiveView,
  orderCount,
}: {
  activeView: WorkspaceView;
  setActiveView: Dispatch<SetStateAction<WorkspaceView>>;
  orderCount: number;
}) {
  const copy =
    activeView === "menu"
      ? { eyebrow: "Front of house", title: "Menu & ordering", body: "Browse the live menu and build a ticket." }
      : { eyebrow: "Kitchen", title: "Order management", body: "Every ticket on the books, newest first." };

  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-edge pb-4">
      <div>
        <p className="label">{copy.eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="mt-0.5 text-sm text-ink-muted">{copy.body}</p>
      </div>

      <div
        role="tablist"
        aria-label="Restaurant workspace"
        className="flex gap-1 rounded-lg border border-edge bg-surface p-1"
      >
        {navItems.map((item) => (
          <button
            key={item.view}
            role="tab"
            aria-selected={activeView === item.view}
            onClick={() => setActiveView(item.view)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeView === item.view
                ? "bg-raised text-ink"
                : "text-ink-subtle hover:text-ink-muted"
            }`}
          >
            {item.label}
            {item.view === "orders" && (
              <span className="tnum text-ink-subtle">{orderCount}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function FeedbackMessages({
  error,
  notice,
  onRetry,
}: {
  error: string;
  notice: string;
  onRetry: () => void;
}) {
  return (
    <div aria-live="polite" className="flex flex-col gap-2 empty:mt-0">
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-cancelled/30 bg-cancelled/10 px-3 py-2 text-sm text-cancelled">
          <span className="flex items-center gap-2">
            <span aria-hidden="true">⚠</span>
            {error}
          </span>
          <button
            onClick={onRetry}
            className="shrink-0 rounded-md border border-cancelled/30 px-2 py-1 text-xs font-medium transition hover:bg-cancelled/20"
          >
            Retry
          </button>
        </div>
      )}
      {notice && (
        <div className="flex items-center gap-2 rounded-lg border border-completed/30 bg-completed/10 px-3 py-2 text-sm text-completed">
          <span aria-hidden="true">✓</span>
          {notice}
        </div>
      )}
    </div>
  );
}