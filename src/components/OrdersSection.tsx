import type { OrderStatus, RestaurantOrder } from "@/lib/api";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const statusStyles: Record<OrderStatus, string> = {
  pending: "border-pending/30 bg-pending/10 text-pending",
  preparing: "border-preparing/30 bg-preparing/10 text-preparing",
  ready: "border-ready/30 bg-ready/10 text-ready",
  completed: "border-completed/30 bg-completed/10 text-completed",
  cancelled: "border-cancelled/30 bg-cancelled/10 text-cancelled",
};

function formatDate(value: string): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : dateFormat.format(parsed);
}

export function OrdersSection({
  orders,
  loading,
}: {
  orders: RestaurantOrder[];
  loading: boolean;
}) {
  return (
    <section className="flex flex-col" aria-label="Existing orders">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight">Orders</h2>
        <span className="tnum text-xs text-ink-subtle">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </span>
      </div>

      <div className="panel mt-4 overflow-hidden">
        {loading && orders.length === 0 ? (
          <div className="flex items-center justify-center gap-2.5 px-4 py-16 text-sm text-ink-subtle">
            <span className="size-4 animate-spin rounded-full border-2 border-edge-strong border-t-accent" />
            Loading orders
          </div>
        ) : orders.length ? (
          <>
            <div className="hidden grid-cols-[7rem_1fr_7rem_6rem] gap-4 border-b border-edge px-4 py-2 md:grid">
              <span className="label">Order</span>
              <span className="label">Items</span>
              <span className="label">Status</span>
              <span className="label text-right">Total</span>
            </div>

            <ul className="divide-y divide-edge">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="grid grid-cols-1 gap-2 px-4 py-3 transition hover:bg-surface md:grid-cols-[7rem_1fr_7rem_6rem] md:items-center md:gap-4"
                >
                  <div className="flex items-baseline gap-2 md:block">
                    <span className="tnum text-sm font-semibold">#{String(order.id).padStart(4, "0")}</span>
                    <span className="tnum text-xs text-ink-subtle md:block">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm">{order.customerName}</p>
                    {order.items.length ? (
                      <p className="mt-0.5 truncate text-xs text-ink-subtle">
                        {order.items
                          .map((line) => `${line.quantity}× ${line.name}`)
                          .join(" · ")}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-ink-subtle">No items recorded</p>
                    )}
                  </div>

                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize ${
                        statusStyles[order.status]
                      }`}
                    >
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                      {order.status}
                    </span>
                  </div>

                  <span className="tnum text-sm font-semibold md:text-right">
                    {currency.format(order.total)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-6 py-16 text-center">
            <span aria-hidden="true" className="text-2xl text-ink-subtle">
              ≡
            </span>
            <p className="text-sm font-medium">No orders yet</p>
            <p className="text-xs text-ink-subtle">Tickets placed from the menu land here.</p>
          </div>
        )}
      </div>
    </section>
  );
}