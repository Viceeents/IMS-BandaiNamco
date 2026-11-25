# Tarnished Ledger

An Elden Ring inspired Bandai Namco merchandise inventory system. The React
client uses the Express API and MongoDB database for login, inventory, stock
movements, dashboard totals, and reports.

## Project structure

```text
IMSforINFOSEC/
|-- client/             React + Vite app and Elden Ring visual assets
|-- server/             Express API, MongoDB models, routes, and seed script
|-- docs/               Project notes
`-- tests/              Reserved for future tests
```

## Start the API

1. Install Node.js 20.19 or newer and MongoDB Community Server (or use a hosted
   MongoDB URI). If PowerShell says `npm` is not recognized, install Node.js
   with npm enabled and reopen PowerShell so its PATH refreshes.
2. In a terminal, move into `IMSforINFOSEC/server` and install dependencies:

   ```powershell
   npm install
   Copy-Item .env.example .env
   ```

3. The example `.env` is configured for local MongoDB at
   `mongodb://127.0.0.1:27017/bandai_namco_ims`. Start the MongoDB service
   before seeding. For Atlas, replace `MONGO_URI` with your connection URI.
4. Seed an administrator, ten sample products, and their initial stock logs:

   ```powershell
   node seed.js
   ```

   The local demo credentials are `admin@bandainamco.com` / `admin123`. Seeding
   is repeatable: it keeps existing products and does not delete your data. If
   that administrator already exists, its password is left unchanged.
5. Start the API:

   ```powershell
   npm run dev
   ```

   `http://localhost:5000/` confirms the API is running. `GET
   http://localhost:5000/api/health` returns `{ "status": "ok" }` when
   the server is running. `CLIENT_ORIGIN` is a comma separated allowlist for a
   future local web server; opening the HTML directly uses a `null` origin and
   is not included by default.

The sample JWT secret and admin password are for a local presentation setup.
Replace them before exposing the API outside your machine.

## Start the React website

Open a second terminal in `IMSforINFOSEC/client`, then run:

```powershell
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). The
client sends authenticated requests to `http://localhost:5000/api`. The server
allows the default Vite origins in `CLIENT_ORIGIN`. `VITE_API_URL` can override
the API base URL when needed.

## API routes

Protected routes expect `Authorization: Bearer <token>`. Login returns a token.
Registration, item creation/edits/deletion require an Admin account. Staff can
read inventory and make stock adjustments.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Sign in |
| `POST` | `/api/auth/register` | Admin creates a user |
| `GET` | `/api/products/stats` | Dashboard inventory totals |
| `GET` | `/api/products` | List; supports `search`, `category`, `franchise`, `status=low|out` |
| `GET` | `/api/products/:id` | Read one item |
| `POST` | `/api/products` | Create item and audit entry (Admin) |
| `PUT` | `/api/products/:id` | Edit item details (Admin) |
| `PATCH` | `/api/products/:id/stock` | Record `IN`, `OUT`, or target `ADJUST` quantity |
| `DELETE` | `/api/products/:id` | Delete item and retain an audit entry (Admin) |
| `GET` | `/api/logs` | Newest stock history; supports `type`, `sku`, and `limit` |

## Website pages

- **Login:** signs in through `/api/auth/login`; the JWT is kept in browser local
  storage and sent with protected API requests.
- **Dashboard:** reads current inventory totals, low stock, category counts, and
  recent stock movements.
- **Inventory:** searches and filters products, inspects details, and records
  inbound, outbound, or stock count adjustments.
- **Smithing Table:** Admins create and edit product records.
- **Ledger of Deeds:** reads stock audit entries and exports the visible results
  to CSV.

The older static page files remain in `client/pages/` as reference material;
the active website is the React app in `client/src/`.
