export type Category = {
  id: string;
  name: string;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  categoryName: string;
};

export type OrderLine = {
  name: string;
  quantity: number;
};

export type RestaurantOrder = {
  id: string;
  status: string;
  createdAt: string;
  total: number | null;
  items: OrderLine[];
};

type ApiRecord = Record<string, unknown>;

const configuredBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const baseUrl = configuredBaseUrl.replace(/\/$/, "");

function asRecord(value: unknown): ApiRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as ApiRecord)
    : {};
}

function first(record: ApiRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function text(value: unknown, fallback = ""): string {
  return value === undefined || value === null ? fallback : String(value);
}

function number(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function rows(payload: unknown, collection: string): ApiRecord[] {
  if (Array.isArray(payload)) return payload.map(asRecord);
  const root = asRecord(payload);
  const data = asRecord(root.data);
  const candidates = [root[collection], root.data, root.rows, root.results, data[collection]];
  const found = candidates.find(Array.isArray);
  return Array.isArray(found) ? found.map(asRecord) : [];
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error(`Could not reach the API at ${baseUrl}. Check that your backend is running.`);
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const body = asRecord(payload);
    throw new Error(text(first(body, "message", "error"), `Request failed (${response.status}).`));
  }
  return payload;
}

function normalizeCategory(row: ApiRecord): Category {
  return {
    id: text(first(row, "id", "category_id", "categoryId")),
    name: text(first(row, "name", "title"), "Unnamed category"),
  };
}

function normalizeMenuItem(row: ApiRecord, categories: Category[]): MenuItem {
  const relation = asRecord(first(row, "category"));
  const categoryId = text(first(row, "category_id", "categoryId") ?? first(relation, "id"));
  const category = categories.find((entry) => entry.id === categoryId);
  return {
    id: text(first(row, "id", "menu_item_id", "menuItemId")),
    name: text(first(row, "name", "title"), "Unnamed item"),
    description: text(first(row, "description")),
    price: number(first(row, "price")),
    categoryId,
    categoryName: text(
      first(relation, "name", "title") ?? first(row, "category_name", "categoryName") ?? category?.name,
    ),
  };
}

function normalizeOrder(row: ApiRecord): RestaurantOrder {
  const rawItems = first(row, "order_items", "orderItems", "items");
  const items = Array.isArray(rawItems) ? rawItems.map((value) => {
    const line = asRecord(value);
    const menuItem = asRecord(first(line, "menu_item", "menuItem", "menu_item_details"));
    return {
      name: text(
        first(menuItem, "name", "title") ?? first(line, "menu_item_name", "menuItemName", "name"),
        "Menu item",
      ),
      quantity: number(first(line, "quantity"), 1),
    };
  }) : [];
  const totalValue = first(row, "total", "total_amount", "totalAmount");
  const parsedTotal = totalValue === undefined ? null : number(totalValue, Number.NaN);
  return {
    id: text(first(row, "id", "order_id", "orderId"), "—"),
    status: text(first(row, "status"), "Received"),
    createdAt: text(first(row, "created_at", "createdAt", "order_date", "orderDate")),
    total: parsedTotal !== null && Number.isFinite(parsedTotal) ? parsedTotal : null,
    items,
  };
}

export const api = {
  baseUrl,
  async getCategories(): Promise<Category[]> {
    return rows(await request("/categories"), "categories").map(normalizeCategory);
  },
  async getMenuItems(): Promise<MenuItem[]> {
    const [payload, categories] = await Promise.all([
      request("/menu-items"),
      this.getCategories(),
    ]);
    return rows(payload, "menu_items").map((row) => normalizeMenuItem(row, categories));
  },
  async getOrders(): Promise<RestaurantOrder[]> {
    return rows(await request("/orders"), "orders").map(normalizeOrder);
  },
  async createOrder(items: { menu_item_id: string; quantity: number }[]): Promise<unknown> {
    return request("/orders", {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  },
};