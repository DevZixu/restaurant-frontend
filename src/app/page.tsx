"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  api,
  ApiError,
  type AuthUser,
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
import { AuthPanel, type AuthMode } from "@/components/AuthPanel";

type Cart = Record<number, number>;
type CategoryFilter = number | "all";

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [cart, setCart] = useState<Cart>({});
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [activeView, setActiveView] = useState<WorkspaceView>("menu");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authChecking, setAuthChecking] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");

  async function loadRestaurantData() {
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
      if (cause instanceof ApiError && cause.status === 401) {
        setUser(null);
        return;
      }
      setError(cause instanceof Error ? cause.message : "Unable to load restaurant data.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshData() {
    if (!user) return;
    await loadRestaurantData();
  }

  useEffect(() => {
    let active = true;
    api.getCurrentUser()
      .then(async (currentUser) => {
        if (!active) return;
        setUser(currentUser);
        await loadRestaurantData();
      })
      .catch((cause: unknown) => {
        if (active && !(cause instanceof ApiError && cause.status === 401)) {
          setError(cause instanceof Error ? cause.message : "Unable to load restaurant data.");
        }
      })
      .finally(() => {
        if (active) setAuthChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function submitAuth(values: { name: string; email: string; password: string }) {
    setAuthSubmitting(true);
    setError("");
    try {
      const signedInUser = authMode === "login"
        ? await api.login(values.email, values.password)
        : await api.register(values.name, values.email, values.password);
      setUser(signedInUser);
      await loadRestaurantData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function signOut() {
    try {
      await api.logout();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign out.");
      return;
    }
    setUser(null);
    setCategories([]);
    setMenu([]);
    setOrders([]);
    setCart({});
    setNotice("");
  }

  const availableMenu = useMemo(() => menu.filter((item) => item.available), [menu]);

  const visibleMenu = useMemo(
    () =>
      activeCategory === "all"
        ? availableMenu
        : availableMenu.filter((item) => item.categoryId === activeCategory),
    [activeCategory, availableMenu],
  );

  const cartItems: CartItem[] = useMemo(
    () => availableMenu.flatMap((item) => cart[item.id] ? [{ item, quantity: cart[item.id] }] : []),
    [cart, availableMenu],
  );
  const total = cartItems.reduce(
    (sum, entry) => sum + entry.item.price * entry.quantity,
    0,
  );
  const itemCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);

  function changeQuantity(itemId: number, change: number) {
    setCart((current) => {
      const nextQuantity = Math.min(99, (current[itemId] ?? 0) + change);
      const next = { ...current };
      if (nextQuantity <= 0) delete next[itemId];
      else next[itemId] = nextQuantity;
      return next;
    });
    setNotice("");
  }

  async function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cartItems.length || !customerName.trim()) return;
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      await api.createOrder({
        customerName: customerName.trim(),
        items: cartItems.map(({ item, quantity }) => ({ menuItemId: item.id, quantity })),
      });
      setCart({});
      setCustomerName("");
      setNotice("Order placed successfully.");
      setActiveView("orders");
      setOrders(await api.getOrders());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to place this order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (authChecking) {
    return (
      <main className="grid min-h-screen place-items-center">
        <div className="flex items-center gap-2.5 text-sm text-ink-subtle">
          <span className="size-4 animate-spin rounded-full border-2 border-edge-strong border-t-accent" />
          Checking session
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <AuthPanel
        mode={authMode}
        loading={authSubmitting}
        error={error}
        onModeChange={(mode) => {
          setAuthMode(mode);
          setError("");
        }}
        onSubmit={(values) => void submitAuth(values)}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col" id="home">
      <Topbar
        onRefresh={() => void refreshData()}
        loading={loading}
        user={user}
        onLogout={() => void signOut()}
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          orderCount={orders.length}
          apiAddress={api.baseUrl}
        />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6">
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
            <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
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
                customerName={customerName}
                onCustomerNameChange={setCustomerName}
                submitting={submitting}
                onSubmit={createOrder}
                onClear={() => setCart({})}
              />
            </div>
          ) : (
            <div className="mt-6">
              <OrdersSection orders={orders} loading={loading} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}