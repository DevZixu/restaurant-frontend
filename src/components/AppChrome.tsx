import type { Dispatch, SetStateAction } from "react";

export type WorkspaceView = "menu" | "orders";

export function Topbar({
  onRefresh,
  loading,
}: {
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <header className="topbar">
      <a className="wordmark" href="#home" aria-label="Restaurant operations home">
        <span className="wordmark-mark">R</span>
        <span>Service desk</span>
      </a>
      <div className="topbar-meta">
        <span className="connection-dot" />
        <span>Restaurant operations</span>
      </div>
      <button className="refresh-button" onClick={onRefresh} disabled={loading}>
        <span aria-hidden="true">↻</span> Refresh
      </button>
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
    <aside className="rail" aria-label="Main navigation">
      <span className="rail-label">Workspace</span>
      <button
        className={`rail-link ${activeView === "menu" ? "is-active" : ""}`}
        onClick={() => setActiveView("menu")}
      >
        <span className="rail-icon" aria-hidden="true">▦</span>
        Menu &amp; order
      </button>
      <button
        className={`rail-link ${activeView === "orders" ? "is-active" : ""}`}
        onClick={() => setActiveView("orders")}
      >
        <span className="rail-icon" aria-hidden="true">≡</span>
        Orders
        <span className="rail-count">{orderCount}</span>
      </button>
      <div className="rail-footer">
        <span className="rail-label">Data source</span>
        <span className="api-address">{apiAddress}</span>
      </div>
    </aside>
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
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">Front of house / Overview</p>
        <h1>{activeView === "menu" ? "Menu & ordering" : "Order management"}</h1>
        <p className="page-subtitle">
          {activeView === "menu"
            ? "Browse the live menu and build an order."
            : "Review orders and the items attached to each one."}
        </p>
      </div>
      <div className="view-switch" role="tablist" aria-label="Restaurant workspace">
        <button
          role="tab"
          aria-selected={activeView === "menu"}
          className={activeView === "menu" ? "selected" : ""}
          onClick={() => setActiveView("menu")}
        >Menu</button>
        <button
          role="tab"
          aria-selected={activeView === "orders"}
          className={activeView === "orders" ? "selected" : ""}
          onClick={() => setActiveView("orders")}
        >Orders <span>{orderCount}</span></button>
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
    <>
      {error && (
        <div className="alert" role="alert">
          <span>{error}</span>
          <button onClick={onRetry}>Try again</button>
        </div>
      )}
      {notice && <div className="notice" role="status">{notice}</div>}
    </>
  );
}