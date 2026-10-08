# Restaurant Service Desk

Frontend-only Next.js app for browsing menu items, creating orders, and reviewing existing orders from an Express REST API.

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_API_URL` in `.env.local` to the Express server URL, with or without the `/api` suffix. The default is `http://localhost:5000`. Browser requests go to the frontend's same-origin `/api` path, which Next.js rewrites to the backend. Restart the dev server after changing this value. Start the backend separately, then open [http://localhost:3000](http://localhost:3000).

## API contract used

The frontend uses these endpoints:

| Method | Endpoint | Expected data |
| --- | --- | --- |
| GET | `/api/auth/me` | Current signed-in user |
| POST | `/api/auth/login` | `{ "email": "…", "password": "…" }` |
| POST | `/api/auth/register` | `{ "name": "…", "email": "…", "password": "…" }` |
| POST | `/api/auth/logout` | Ends the current session |
| GET | `/api/categories` | Categories with `id` and `name` |
| GET | `/api/menu-items` | Menu items; unavailable items are excluded from ordering |
| GET | `/api/orders` | Orders with hydrated items and order totals |
| POST | `/api/orders` | `{ "customerName": "Avery Chen", "items": [{ "menuItemId": 1, "quantity": 2 }] }` |

All endpoints except health, login, registration, and logout require a signed-in session. Login and registration set the HttpOnly `restaurant.sid` cookie; browser requests include it with `credentials: include`. Responses may be direct arrays or objects containing a named collection, `data`, `rows`, or `results`. Menu-item and order relations support the API's camelCase fields and common snake_case variants.

The same-origin rewrite forwards requests and session cookies through Next.js, so the browser does not need cross-origin CORS permission from the API.

This project does not include a backend, database, or sample restaurant data; menu and order data are fetched from the configured API at runtime.

The frontend converts database menu-item IDs to integers before creating an order and limits each line quantity to the API's range of 1–99.

## Frontend structure

- `src/app/page.tsx` coordinates API loading, page state, cart calculations, and order submission.
- `src/components/AppChrome.tsx` contains the top bar, sidebar, page heading, and feedback messages.
- `src/components/MenuSection.tsx` renders category filters and menu item quantity controls.
- `src/components/CurrentOrder.tsx` renders the active cart and submits/clears it through callbacks.
- `src/components/OrdersSection.tsx` renders the order list and line items.
- `src/lib/api.ts` contains API requests and response normalization.

## Checks

```bash
npm run lint
npm run build
```