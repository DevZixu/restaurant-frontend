"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  api,
  type Category,
  type MenuItem,
  type RestaurantOrder,
} from "@/lib/api";
import { CurrentOrder, type CartItem } from "@/components/CurrentOrder";
import {
  FeedbackMessages,
  PageHeading,
  Sidebar,
  Topbar,
  type WorkspaceView,
} from "@/components/AppChrome";
import { MenuSection } from "@/components/MenuSection";
import { OrdersSection } from "@/components/OrdersSection";

type Cart = Record<string, number>;

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [cart, setCart] = useState<Cart>({});
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeView, setActiveView] = useState<WorkspaceView>("menu");
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
    let active = true;
    Promise.all([api.getCategories(), api.getMenuItems(), api.getOrders()])
      .then(([nextCategories, nextMenu, nextOrders]) => {
        if (!active) return;
        setCategories(nextCategories);
        setMenu(nextMenu);
        setOrders(nextOrders);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Unable to load restaurant data.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleMenu = useMemo(
    () =>
      activeCategory === "all"
        ? menu
        : menu.filter((item) => item.categoryId === activeCategory),
    [activeCategory, menu],
  );

  const cartItems: CartItem[] = useMemo(
    () => menu.flatMap((item) => cart[item.id] ? [{ item, quantity: cart[item.id] }] : []),
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
      <Topbar onRefresh={() => void refreshData()} loading={loading} />
      <div className="workspace" id="home">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          orderCount={orders.length}
          apiAddress={api.baseUrl.replace(/^https?:\/\//, "")}
        />
        <section className="content-area">
          <PageHeading
            activeView={activeView}
            setActiveView={setActiveView}
            orderCount={orders.length}
          />
          <FeedbackMessages
            error={error}
            notice={notice}
            onRetry={() => void refreshData()}
          />
          {activeView === "menu" ? (
            <div className="ordering-layout">
              <MenuSection
                categories={categories}
                items={visibleMenu}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                loading={loading}
                cart={cart}
                onQuantityChange={changeQuantity}
              />
              <CurrentOrder
                items={cartItems}
                total={total}
                itemCount={itemCount}
                submitting={submitting}
                onSubmit={createOrder}
                onClear={() => setCart({})}
              />
            </div>
          ) : (
            <OrdersSection orders={orders} loading={loading} />
          )}
        </section>
      </div>
    </main>
  );
}