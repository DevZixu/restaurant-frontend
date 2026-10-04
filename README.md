# Restaurant Service Desk

Frontend-only Next.js app for browsing menu items, creating orders, and reviewing existing orders from an Express REST API.

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_API_URL` in `.env.local` to the base URL of the Express API. The default is `http://localhost:5000/api`. Start the backend separately, then open [http://localhost:3000](http://localhost:3000).

## API contract used

The frontend reads these endpoints:

| Method | Endpoint | Expected data |
| --- | --- | --- |
| GET | `/categories` | Array of categories with `id` and `name` |
| GET | `/menu-items` | Array of items with `id`, `name`, `description`, `price`, and `category_id` or nested `category` |
| GET | `/orders` | Array of orders with `id`, `status`, and `items` or `order_items` |
| POST | `/orders` | `{ "items": [{ "menu_item_id": "…", "quantity": 2 }] }` |

Responses may be a direct array or an object containing the named collection (or `data`, `rows`, or `results`). Order item menu names can be returned via a nested `menu_item` / `menuItem` relation or `menu_item_name`. The UI presents order totals when the API returns `total` or `total_amount`.

The API must allow browser requests from the frontend origin (CORS). This project does not include a backend, database, or sample restaurant data; the menu and orders are fetched from the configured API at runtime.

## Checks

```bash
npm run lint
npm run build
```