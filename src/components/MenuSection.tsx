import type { Category, MenuItem } from "@/lib/api";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function MenuSection({
  categories,
  items,
  activeCategory,
  onCategoryChange,
  loading,
  cart,
  onQuantityChange,
}: {
  categories: Category[];
  items: MenuItem[];
  activeCategory: number | "all";
  onCategoryChange: (categoryId: number | "all") => void;
  loading: boolean;
  cart: Record<number, number>;
  onQuantityChange: (itemId: number, change: number) => void;
}) {
  const totalItems = items.length;

  return (
    <section className="flex min-w-0 flex-col" aria-label="Available menu items">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight">Menu</h2>
        <span className="tnum text-xs text-ink-subtle">
          {totalItems} {totalItems === 1 ? "item" : "items"}
        </span>
      </div>

      <div
        className="mt-3 flex flex-wrap gap-1.5"
        role="group"
        aria-label="Filter menu by category"
      >
        <FilterChip
          active={activeCategory === "all"}
          onClick={() => onCategoryChange("all")}
        >
          All
        </FilterChip>
        {categories.map((category) => (
          <FilterChip
            key={category.id}
            active={activeCategory === category.id}
            onClick={() => onCategoryChange(category.id)}
          >
            {category.name}
          </FilterChip>
        ))}
      </div>

      <div className="panel mt-4 overflow-hidden">
        {loading && totalItems === 0 ? (
          <div className="flex items-center justify-center gap-2.5 px-4 py-16 text-sm text-ink-subtle">
            <span className="size-4 animate-spin rounded-full border-2 border-edge-strong border-t-accent" />
            Loading menu
          </div>
        ) : totalItems ? (
          <ul className="divide-y divide-edge">
            {items.map((item) => {
              const quantity = cart[item.id] ?? 0;
              const inCart = quantity > 0;
              return (
                <li
                  key={item.id}
                  className={`relative flex items-center gap-4 px-4 py-3 transition ${
                    inCart ? "bg-raised" : "hover:bg-surface"
                  }`}
                >
                  {inCart && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 w-0.5 bg-accent"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <h3 className="truncate text-sm font-medium">{item.name}</h3>
                      <span className="rounded border border-edge px-1.5 py-px text-[10px] uppercase tracking-wide text-ink-subtle">
                        {item.categoryName || "Uncategorized"}
                      </span>
                    </div>
                    {item.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-ink-subtle">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <span className="tnum shrink-0 text-sm font-medium text-ink-muted">
                    {currency.format(item.price)}
                  </span>

                  <div className="shrink-0">
                    {inCart ? (
                      <div className="flex items-center gap-1 rounded-lg border border-edge-strong bg-canvas p-0.5">
                        <StepButton
                          label={`Remove one ${item.name}`}
                          onClick={() => onQuantityChange(item.id, -1)}
                        >
                          −
                        </StepButton>
                        <span className="tnum w-7 text-center text-sm font-semibold">
                          {quantity}
                        </span>
                        <StepButton
                          label={`Add one ${item.name}`}
                          onClick={() => onQuantityChange(item.id, 1)}
                        >
                          +
                        </StepButton>
                      </div>
                    ) : (
                      <button
                        onClick={() => onQuantityChange(item.id, 1)}
                        className="rounded-lg border border-edge-strong bg-raised px-3 py-1.5 text-xs font-medium transition hover:border-accent hover:text-accent"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-4 py-16 text-center text-sm text-ink-subtle">
            Nothing on the menu in this category.
          </p>
        )}
      </div>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
        active
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-edge bg-surface text-ink-muted hover:border-edge-strong hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function StepButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-md text-sm text-ink-muted transition hover:bg-raised hover:text-ink"
    >
      {children}
    </button>
  );
}