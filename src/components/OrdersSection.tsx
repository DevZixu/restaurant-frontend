import type { RestaurantOrder } from "@/lib/api";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function OrdersSection({
  orders,
  loading,
}: {
  orders: RestaurantOrder[];
  loading: boolean;
}) {
  return (
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
  );
}