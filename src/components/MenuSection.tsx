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
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  loading: boolean;
  cart: Record<string, number>;
  onQuantityChange: (itemId: string, change: number) => void;
}) {
  return (
    <section className="menu-section" aria-label="Available menu items">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Kitchen catalog</p>
          <h2>Available menu</h2>
        </div>
        <span className="result-count">{items.length} items</span>
      </div>
      <div className="category-filter" aria-label="Filter menu by category">
        <button
          className={activeCategory === "all" ? "filter-active" : ""}
          onClick={() => onCategoryChange("all")}
        >All items</button>
        {categories.map((category) => (
          <button
            key={category.id}
            className={activeCategory === category.id ? "filter-active" : ""}
            onClick={() => onCategoryChange(category.id)}
          >{category.name}</button>
        ))}
      </div>

      {loading && items.length === 0 ? (
        <div className="empty-state"><span className="loader" />Loading menu…</div>
      ) : items.length ? (
        <div className="menu-list">
          {items.map((item, index) => (
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
                    <button aria-label={`Remove one ${item.name}`} onClick={() => onQuantityChange(item.id, -1)}>−</button>
                    <span>{cart[item.id]}</span>
                    <button aria-label={`Add one ${item.name}`} onClick={() => onQuantityChange(item.id, 1)}>+</button>
                  </>
                ) : (
                  <button className="add-button" onClick={() => onQuantityChange(item.id, 1)}>
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
  );
}