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
  customerName,
  onCustomerNameChange,
  submitting,
  onSubmit,
  onClear,
}: {
  items: CartItem[];
  total: number;
  itemCount: number;
  customerName: string;
  onCustomerNameChange: (value: string) => void;
  submitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClear: () => void;
}) {
  return (
    <aside className="panel flex flex-col overflow-hidden lg:sticky lg:top-18" aria-label="Current order">
      <header className="flex items-center justify-between gap-3 border-b border-edge px-4 py-3">
        <div>
          <p className="label">Current ticket</p>
          <h2 className="mt-0.5 text-sm font-semibold tracking-tight">New order</h2>
        </div>
        <span className="tnum rounded-md bg-raised px-2 py-1 text-xs font-semibold text-ink-muted">
          {itemCount} {itemCount === 1 ? "unit" : "units"}
        </span>
      </header>

      {items.length ? (
        <>
          <ul className="max-h-[42vh] flex-1 divide-y divide-edge overflow-y-auto lg:max-h-none">
            {items.map(({ item, quantity }) => (
              <li key={item.id} className="flex items-baseline gap-3 px-4 py-2.5">
                <span className="tnum w-8 shrink-0 text-sm font-semibold text-accent">
                  {quantity}×
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span>
                <span className="tnum shrink-0 text-sm text-ink-muted">
                  {currency.format(item.price * quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex items-baseline justify-between border-t border-edge px-4 py-3">
            <span className="label">Subtotal</span>
            <span className="tnum text-xl font-semibold tracking-tight">
              {currency.format(total)}
            </span>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-2.5 border-t border-edge p-4">
            <label className="flex flex-col gap-1.5">
              <span className="label">Customer name</span>
              <input
                className="field"
                value={customerName}
                onChange={(event) => onCustomerNameChange(event.target.value)}
                maxLength={120}
                placeholder="Who is this for?"
                required
              />
            </label>

            <button
              className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-canvas transition hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-40"
              disabled={submitting || !customerName.trim()}
            >
              {submitting ? (
                <>
                  <span className="size-3.5 animate-spin rounded-full border-2 border-canvas/30 border-t-canvas" />
                  Placing order
                </>
              ) : (
                <>
                  Place order
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClear}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-subtle transition hover:bg-raised hover:text-ink-muted"
            >
              Clear ticket
            </button>
          </form>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-6 py-14 text-center">
          <span aria-hidden="true" className="text-2xl text-ink-subtle">
            ＋
          </span>
          <p className="text-sm font-medium">Ticket is empty</p>
          <p className="text-xs text-ink-subtle">Add items from the menu to get started.</p>
        </div>
      )}
    </aside>
  );
}