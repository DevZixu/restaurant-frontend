export type UserRole = "admin" | "manager" | "staff";

export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type Category = {
  id: number;
  name: string;
  description: string;
  createdAt: string;
};

export type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  categoryName: string;
  available: boolean;
  createdAt: string;
};

export type OrderLine = {
  id: number;
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type RestaurantOrder = {
  id: number;
  customerName: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  items: OrderLine[];
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role?: Exclude<UserRole, "admin">;
};

export type UpdateUserInput = {
  name?: string;
  email?: string;
  password?: string;
  role?: Exclude<UserRole, "admin">;
};

export type CreateCategoryInput = {
  name: string;
  description?: string;
};

export type UpdateCategoryInput = CreateCategoryInput;

export type CreateMenuItemInput = {
  name: string;
  description?: string;
  price: number;
  categoryId: number;
  available?: boolean;
};

export type UpdateMenuItemInput = Partial<CreateMenuItemInput>;

export type CreateOrderInput = {
  customerName: string;
  items: { menuItemId: number; quantity: number }[];
};

export type UpdateOrderInput = {
  customerName?: string;
  status?: OrderStatus;
  items?: { menuItemId: number; quantity: number }[];
};

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiRecord = Record<string, unknown>;

const baseUrl = "/api";

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, fallback = ""): string {
  return value === undefined || value === null ? fallback : String(value);
}

function num(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * The API returns Postgres timestamps ("2026-10-04 20:00:32.825333+01"), which
 * is not valid ISO 8601, so `new Date()` is implementation-defined and fails in
 * some browsers. Rewrite to the strict ISO form the spec guarantees.
 */
function isoTimestamp(value: unknown): string {
  const raw = text(value).trim();
  if (!raw) return "";
  const parts =
    /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.(\d+))?(?:([+-])(\d{2}):?(\d{2}))?$/.exec(raw);
  if (!parts) {
    const fallback = new Date(raw);
    return Number.isNaN(fallback.getTime()) ? "" : fallback.toISOString();
  }
  const [, date, time, fraction, sign, offsetHours, offsetMinutes] = parts;
  const milliseconds = fraction ? `.${fraction.slice(0, 3).padEnd(3, "0")}` : "";
  const offset =
    sign === undefined ? "" : `${sign}${offsetHours}:${offsetMinutes}`;
  const parsed = new Date(`${date}T${time}${milliseconds}${offset}`);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

/**
 * Identifiers are integers everywhere except one place: the API parses ids out
 * of JSON bodies with a string-only guard, so an id sent as a number is
 * rejected with "Resource id is required". Serialize to a string at the wire
 * boundary and validate the same way the server does, so a bad id fails here
 * with a useful message instead of a confusing 400.
 */
function idParam(id: number | string, label = "Resource id"): string {
  const numeric = typeof id === "number" ? id : Number(text(id).trim());
  if (!Number.isSafeInteger(numeric) || numeric < 1) {
    throw new ApiError(`${label} must be a positive integer (received ${String(id)}).`, 400);
  }
  return String(numeric);
}

function orderItems(ids: { menuItemId: number; quantity: number }[]) {
  return ids.map((entry) => ({
    menuItemId: idParam(entry.menuItemId, "Menu item id"),
    quantity: entry.quantity,
  }));
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      cache: "no-store",
      credentials: "include",
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error(
      `Could not reach the API at ${baseUrl}. Check that the backend is running.`,
    );
  }

  if (response.status === 204) return null;

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const body = isRecord(payload) ? payload : {};
    throw new ApiError(
      text(body.error, text(body.message, `Request failed (${response.status}).`)),
      response.status,
    );
  }
  return payload;
}

/** List endpoints return bare arrays; anything else is a contract break worth surfacing. */
function list(payload: unknown, resource: string): ApiRecord[] {
  if (!Array.isArray(payload)) {
    throw new ApiError(`Expected a list of ${resource} from the API.`, 500);
  }
  return payload.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new ApiError(`Unexpected ${resource} payload at index ${index}.`, 500);
    }
    return entry;
  });
}

function one(payload: unknown, resource: string): ApiRecord {
  if (!isRecord(payload)) {
    throw new ApiError(`Expected a ${resource} object from the API.`, 500);
  }
  return payload;
}

function unwrapUser(payload: unknown): ApiRecord {
  const root = one(payload, "user");
  return isRecord(root.user) ? root.user : root;
}

function normalizeUser(payload: unknown): AuthUser {
  const row = unwrapUser(payload);
  const role = text(row.role, "staff");
  return {
    id: num(row.id),
    name: text(row.name),
    email: text(row.email),
    role: role === "admin" || role === "manager" || role === "staff" ? role : "staff",
    createdAt: isoTimestamp(row.createdAt),
  };
}

function normalizeCategory(row: ApiRecord): Category {
  return {
    id: num(row.id),
    name: text(row.name, "Unnamed category"),
    description: text(row.description),
    createdAt: isoTimestamp(row.createdAt),
  };
}

/** Every menu-item response embeds its `category` relation, so no extra lookup is needed. */
function normalizeMenuItem(row: ApiRecord): MenuItem {
  const category = isRecord(row.category) ? row.category : null;
  return {
    id: num(row.id),
    name: text(row.name, "Unnamed item"),
    description: text(row.description),
    price: num(row.price),
    categoryId: num(category ? category.id : row.categoryId),
    available: row.available !== false,
    categoryName: text(category ? category.name : ""),
    createdAt: isoTimestamp(row.createdAt),
  };
}

function normalizeOrder(row: ApiRecord): RestaurantOrder {
  const lines = Array.isArray(row.items) ? row.items : [];
  const items = lines.map((value) => {
    const line = isRecord(value) ? value : {};
    const menuItem = isRecord(line.menuItem) ? line.menuItem : {};
    return {
      id: num(line.id),
      menuItemId: num(line.menuItemId),
      name: text(menuItem.name, "Menu item"),
      quantity: num(line.quantity, 1),
      unitPrice: num(line.unitPrice),
      lineTotal: num(line.lineTotal),
    };
  });
  const status = text(row.status, "pending");
  return {
    id: num(row.id),
    customerName: text(row.customerName),
    status:
      status === "pending" ||
      status === "preparing" ||
      status === "ready" ||
      status === "completed" ||
      status === "cancelled"
        ? status
        : "pending",
    total: num(row.total),
    createdAt: isoTimestamp(row.createdAt),
    items,
  };
}

function json(method: string, body: unknown): RequestInit {
  return { method, body: JSON.stringify(body) };
}

export const api = {
  baseUrl,

  async getCurrentUser(): Promise<AuthUser> {
    return normalizeUser(await request("/auth/me"));
  },

  async login(email: string, password: string): Promise<AuthUser> {
    return normalizeUser(await request("/auth/login", json("POST", { email, password })));
  },

  async register(name: string, email: string, password: string): Promise<AuthUser> {
    return normalizeUser(
      await request("/auth/register", json("POST", { name, email, password })),
    );
  },

  async logout(): Promise<void> {
    await request("/auth/logout", { method: "POST" });
  },

  async getUsers(): Promise<AuthUser[]> {
    return list(await request("/users"), "users").map(normalizeUser);
  },

  async getUser(id: number): Promise<AuthUser> {
    return normalizeUser(await request(`/users/${idParam(id)}`));
  },

  async createUser(input: CreateUserInput): Promise<AuthUser> {
    return normalizeUser(await request("/users", json("POST", input)));
  },

  async updateUser(id: number, input: UpdateUserInput): Promise<AuthUser> {
    return normalizeUser(await request(`/users/${idParam(id)}`, json("PUT", input)));
  },

  async deleteUser(id: number): Promise<void> {
    await request(`/users/${idParam(id)}`, { method: "DELETE" });
  },

  async getCategories(): Promise<Category[]> {
    return list(await request("/categories"), "categories").map(normalizeCategory);
  },

  async getCategory(id: number): Promise<Category> {
    return normalizeCategory(one(await request(`/categories/${idParam(id)}`), "category"));
  },

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    return normalizeCategory(
      one(await request("/categories", json("POST", input)), "category"),
    );
  },

  async updateCategory(id: number, input: UpdateCategoryInput): Promise<Category> {
    return normalizeCategory(
      one(await request(`/categories/${idParam(id)}`, json("PUT", input)), "category"),
    );
  },

  async deleteCategory(id: number): Promise<void> {
    await request(`/categories/${idParam(id)}`, { method: "DELETE" });
  },

  async getMenuItems(options: { categoryId?: number } = {}): Promise<MenuItem[]> {
    const query =
      options.categoryId === undefined
        ? ""
        : `?categoryId=${encodeURIComponent(idParam(options.categoryId, "Category id"))}`;
    return list(await request(`/menu-items${query}`), "menu items").map(normalizeMenuItem);
  },

  async getMenuItem(id: number): Promise<MenuItem> {
    return normalizeMenuItem(one(await request(`/menu-items/${idParam(id)}`), "menu item"));
  },

  async createMenuItem(input: CreateMenuItemInput): Promise<MenuItem> {
    const payload = await request(
      "/menu-items",
      json("POST", { ...input, categoryId: idParam(input.categoryId, "Category id") }),
    );
    return normalizeMenuItem(one(payload, "menu item"));
  },

  async updateMenuItem(id: number, input: UpdateMenuItemInput): Promise<MenuItem> {
    const body: Record<string, unknown> = { ...input };
    if (input.categoryId !== undefined) {
      body.categoryId = idParam(input.categoryId, "Category id");
    }
    return normalizeMenuItem(
      one(await request(`/menu-items/${idParam(id)}`, json("PUT", body)), "menu item"),
    );
  },

  async deleteMenuItem(id: number): Promise<void> {
    await request(`/menu-items/${idParam(id)}`, { method: "DELETE" });
  },

  async getOrders(): Promise<RestaurantOrder[]> {
    return list(await request("/orders"), "orders").map(normalizeOrder);
  },

  async getOrder(id: number): Promise<RestaurantOrder> {
    return normalizeOrder(one(await request(`/orders/${idParam(id)}`), "order"));
  },

  async createOrder(input: CreateOrderInput): Promise<RestaurantOrder> {
    const payload = await request(
      "/orders",
      json("POST", { customerName: input.customerName, items: orderItems(input.items) }),
    );
    return normalizeOrder(one(payload, "order"));
  },

  async updateOrder(id: number, input: UpdateOrderInput): Promise<RestaurantOrder> {
    const body: Record<string, unknown> = { ...input };
    if (input.items !== undefined) body.items = orderItems(input.items);
    return normalizeOrder(
      one(await request(`/orders/${idParam(id)}`, json("PUT", body)), "order"),
    );
  },

  async updateOrderStatus(id: number, status: OrderStatus): Promise<RestaurantOrder> {
    return this.updateOrder(id, { status });
  },

  async deleteOrder(id: number): Promise<void> {
    await request(`/orders/${idParam(id)}`, { method: "DELETE" });
  },
};