"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  api,
  type Category,
  type MenuItem,
  type RestaurantOrder,
} from "@/lib/api";

type Cart = Record<string, number>;

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [cart, setCart] = useState<Cart>({});
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeView, setActiveView] = useState<"menu" | "orders">("menu");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refreshData() {
    setLoading(true);
    setError("");
    try {
      const [nextCategories, nextMenu, nextOrders] = await Promise.all([
        api.getCategories(),
        api.getMenuItems(),
        api.getOrders(),
      ]);
      setCategories(nextCategories);
      setMenu(nextMenu);
      setOrders(nextOrders);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load restaurant data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshData();
  }, []);

  const visibleMenu = useMemo(
    () =>
      activeCategory === "all"
        ? menu
        : menu.filter((item) => item.categoryId === activeCategory),
    [activeCategory, menu],
  );

  const cartItems = useMemo(
    () =>
      menu.flatMap((item) =>
        cart[item.id] ? [{ item, quantity: cart[item.id] }] : [],
      ),
    [cart, menu],
  );
  const total = cartItems.reduce(
    (sum, entry) => sum + entry.item.price * entry.quantity,
    0,
  );
  const itemCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);

  function changeQuantity(itemId: string, change: number) {
    setCart((current) => {
      const nextQuantity = (current[itemId] ?? 0) + change;
      const next = { ...current };
      if (nextQuantity <= 0) delete next[itemId];
      else next[itemId] = nextQuantity;
      return next;
    });
    setNotice("");
  }

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cartItems.length) return;
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      await api.createOrder(
        cartItems.map(({ item, quantity }) => ({
          menu_item_id: item.id,
          quantity,
        })),
      );
      setCart({});
      setNotice("Order placed successfully.");
      setActiveView("orders");
      setOrders(await api.getOrders());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to place this order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#home" aria-label="Restaurant operations home">
          <span className="wordmark-mark">R</span>
          <span>Service desk</span>
        </a>
        <div className="topbar-meta">
          <span className="connection-dot" />
          <span>Restaurant operations</span>
        </div>
        <button className="refresh-button" onClick={() => void refreshData()} disabled={loading}>
          <span aria-hidden="true">↻</span> Refresh
        </button>
      </header>

      <div className="workspace" id="home">
        <aside className="rail" aria-label="Main navigation">
          <span className="rail-label">Workspace</span>
          <button
            className={`rail-link ${activeView === "menu" ? "is-active" : ""}`}
            onClick={() => setActiveView("menu")}
          >
            <span className="rail-icon" aria-hidden="true">▦</span>
            Menu & order
          </button>
          <button
            className={`rail-link ${activeView === "orders" ? "is-active" : ""}`}
            onClick={() => setActiveView("orders")}
          >
            <span className="rail-icon" aria-hidden="true">≡</span>
            Orders
            <span className="rail-count">{orders.length}</span>
          </button>
          <div className="rail-footer">
            <span className="rail-label">Data source</span>
            <span className="api-address">{api.baseUrl.replace(/^https?:\/\//, "")}</span>
          </div>
        </aside>

        <section className="content-area">
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
              >Orders <span>{orders.length}</span></button>
            </div>
          </div>

          {error && (
            <div className="alert" role="alert">
              <span>{error}</span>
              <button onClick={() => void refreshData()}>Try again</button>
            </div>
          )}
          {notice && <div className="notice" role="status">{notice}</div>}

          {activeView === "menu" ? (
            <div className="ordering-layout">
              <section className="menu-section" aria-label="Available menu items">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Kitchen catalog</p>
                    <h2>Available menu</h2>
                  </div>
                  <span className="result-count">{visibleMenu.length} items</span>
                </div>
                <div className="category-filter" aria-label="Filter menu by category">
                  <button
                    className={activeCategory === "all" ? "filter-active" : ""}
                    onClick={() => setActiveCategory("all")}
                  >All items</button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      className={activeCategory === category.id ? "filter-active" : ""}
                      onClick={() => setActiveCategory(category.id)}
                    >{category.name}</button>
                  ))}
                </div>

                {loading && menu.length === 0 ? (
                  <div className="empty-state"><span className="loader" />Loading menu…</div>
                ) : visibleMenu.length ? (
                  <div className="menu-list">
                    {visibleMenu.map((item, index) => (
                      <article className="menu-item" key={item.id} style={{ "--item-order": index } as React.CSSProperties}>
                        <div className="menu-item-main">
                          <div className="menu-item-heading">
                            <h3>{item.name}</h3>
                            <span className="item-price">{currency.format(item.price)}</span>
                          </div>
                          <p className="item-description">{item.description || "No description provided."}</p>
                          <span className="category-tag">{item.categoryName || "Uncategorized"}</span>
                        </div>
                        <div className="quantity-control" aria-label={`${item.name} quantity`}>
                          {cart[item.id] ? (
                            <>
                              <button aria-label={`Remove one ${item.name}`} onClick={() => changeQuantity(item.id, -1)}>−</button>
                              <span>{cart[item.id]}</span>
                              <button aria-label={`Add one ${item.name}`} onClick={() => changeQuantity(item.id, 1)}>+</button>
                            </>
                          ) : (
                            <button className="add-button" onClick={() => changeQuantity(item.id, 1)}>
                              <span aria-hidden="true">+</span> Add
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">No menu items in this category yet.</div>
                )}
              </section>

              <aside className="order-panel" aria-label="Current order">
                <div className="order-panel-heading">
                  <div>
                    <p className="eyebrow">New ticket</p>
                    <h2>Current order</h2>
                  </div>
                  <span className="ticket-count">{itemCount}</span>
                </div>
                {cartItems.length ? (
                  <>
                    <div className="cart-lines">
                      {cartItems.map(({ item, quantity }) => (
                        <div className="cart-line" key={item.id}>
                          <div className="cart-line-quantity">{quantity}<span>×</span></div>
                          <div className="cart-line-name">{item.name}</div>
                          <div className="cart-line-price">{currency.format(item.price * quantity)}</div>
                        </div>
                      ))}
                    </div>
                    <div className="order-total"><span>Subtotal</span><strong>{currency.format(total)}</strong></div>
                    <form onSubmit={createOrder}>
                      <button className="submit-order" disabled={submitting}>
                        {submitting ? "Placing order…" : "Place order"}
                        <span aria-hidden="true">→</span>
                      </button>
                    </form>
                    <button className="clear-order" onClick={() => setCart({})}>Clear order</button>
                  </>
                ) : (
                  <div className="cart-empty">
                    <span className="cart-empty-mark" aria-hidden="true">＋</span>
                    <p>Your order is empty</p>
                    <span>Add items from the menu to start a ticket.</span>
                  </div>
                )}
                <div className="order-panel-foot"><span>Items</span><span>{itemCount}</span></div>
              </aside>
            </div>
          ) : (
            <section className="orders-section" aria-label="Existing orders">
              <div className="orders-table-heading">
                <span>Order</span><span>Items</span><span>Status</span><span>Total</span>
              </div>
              {loading && orders.length === 0 ? (
                <div className="empty-state"><span className="loader" />Loading orders…</div>
              ) : orders.length ? (
                <div className="orders-list">
                  {orders.map((order) => (
                    <article className="order-row" key={order.id}>
                      <div className="order-id-cell">
                        <strong>#{order.id}</strong>
                        <span>{order.createdAt ? new Date(order.createdAt).toLocaleString() : "Date unavailable"}</span>
                      </div>
                      <div className="order-items-cell">
                        {order.items.length ? order.items.map((item, index) => (
                          <span key={`${item.name}-${index}`}>{item.name} <b>× {item.quantity}</b></span>
                        )) : <span className="muted">No item details returned</span>}
                      </div>
                      <span className={`status-pill status-${order.status.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{order.status}</span>
                      <strong className="order-total-cell">{order.total === null ? "—" : currency.format(order.total)}</strong>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state orders-empty">No orders have been placed yet.</div>
              )}
            </section>
          )}
        </section>
      </div>
    </main>
  );
}