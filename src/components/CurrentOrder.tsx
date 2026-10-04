import type { FormEvent } from "react";
import type { MenuItem } from "@/lib/api";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export type CartItem = {
  item: MenuItem;
  quantity: number;
};

export function CurrentOrder({
  items,
  total,
  itemCount,
  submitting,
  onSubmit,
  onClear,
}: {
  items: CartItem[];
  total: number;
  itemCount: number;
  submitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClear: () => void;
}) {
  return (
    <aside className="order-panel" aria-label="Current order">
      <div className="order-panel-heading">
        <div>
          <p className="eyebrow">New ticket</p>
          <h2>Current order</h2>
        </div>
        <span className="ticket-count">{itemCount}</span>
      </div>
      {items.length ? (
        <>
          <div className="cart-lines">
            {items.map(({ item, quantity }) => (
              <div className="cart-line" key={item.id}>
                <div className="cart-line-quantity">{quantity}<span>×</span></div>
                <div className="cart-line-name">{item.name}</div>
                <div className="cart-line-price">{currency.format(item.price * quantity)}</div>
              </div>
            ))}
          </div>
          <div className="order-total"><span>Subtotal</span><strong>{currency.format(total)}</strong></div>
          <form onSubmit={onSubmit}>
            <button className="submit-order" disabled={submitting}>
              {submitting ? "Placing order…" : "Place order"}
              <span aria-hidden="true">→</span>
            </button>
          </form>
          <button className="clear-order" onClick={onClear}>Clear order</button>
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
  );
}