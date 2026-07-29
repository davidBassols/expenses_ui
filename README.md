# Expenses UI

React frontend for the Expenses API (Spring Boot backend in `../expenses`).

**Stack**: Vite · React 19 · TypeScript · MUI 7 · TanStack Query 5 · React Router 7

---

## Prerequisites

- [Node.js](https://nodejs.org) LTS (v20+ recommended) — install for current user, no admin needed
- Backend running on port 8080 (see `../expenses/README.md`)

---

## Getting started

```powershell
# 1. Install dependencies (first time only)
npm install

# 2. Start the dev server
npm run dev
```

Open **http://localhost:5173** in your browser.

You'll be redirected to the **login page** — use the same credentials as the backend
(default for the `local` profile: `admin` / `admin`; see `../expenses/README.md`).

---

## Run together with the backend

Terminal 1 (backend — from `c:\workspace\expenses`):

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
```

Terminal 2 (frontend — from `c:\workspace\expenses-ui`):

```powershell
npm run dev
```

The Vite dev server proxies all `/api/*` requests to `http://localhost:8080`, so no CORS configuration is needed during development.

---

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload (port 5173) |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Preview the production build locally |

---

## Project structure

```
src/
├── api/            # API clients (one file per resource)
│   ├── auth.ts     #   credential storage (localStorage) + header helpers
│   ├── client.ts   #   fetch wrapper — unwraps ApiResponse<T>, injects Basic auth, handles 401
│   ├── categories.ts
│   └── overview.ts
├── components/     # Reusable components (Layout, CategoryFormDialog)
├── pages/          # Route pages (OverviewPage [landing], CategoriesPage, LoginPage)
├── types/          # TypeScript types mirroring backend DTOs
├── App.tsx         # Routes + auth guard
└── main.tsx        # Entry point (providers: Query, Theme, Router)
```

## Pages

| Route | Description |
|---|---|
| `/login` | Sign-in screen (validated against the backend) |
| `/overview` | **Landing page** — pivot table: rows = year-month, columns = categories, cells = totals. Light red if above that category's average, light green otherwise. Averages footer row. |
| `/expenses` | Month view with prev/next navigation. Expenses grouped under their **category columns**; each expense is a card (name + cost + date). **Planned** expenses (future-dated, e.g. auto-generated from recurring rules) are highlighted in light purple with a "planned" chip. Click a card to edit/delete it in a dialog; per-column **+** button pre-selects the category for a new expense. |
| `/categories` | Categories CRUD |
| `/recurring-expenses` | Recurring expenses CRUD: name, cost, period (monthly / every N months), optional start month, active/paused toggle |
| `/tags` | Tags CRUD (e.g. "holidays-2026"). Click a row to open its detail page |
| `/tags/:id` | Tag detail: all expenses carrying the tag + **total cost** (and a total footer row) |

Expenses can be assigned tags from the expense dialog (multi-select); tag chips appear on the expense cards.

Navigation is via a collapsible **side menu** (all four sections), with logout in the top bar.

## Notes

- The backend wraps every response in `{ success, message, data }` — `src/api/client.ts` unwraps it automatically and throws on `success: false`.
- Expenses and recurring-expenses pages are intentionally not included yet.

---

## Security

- The backend requires HTTP Basic auth on all endpoints. The UI stores your
  credentials in `localStorage` after a successful login and sends them as an
  `Authorization: Basic …` header on every request (`src/api/client.ts`).
- Login is validated against the backend before navigating, so typos are caught immediately.
- A 401 response clears the stored credentials and redirects back to the login page.
- **Logout** (top-right) clears credentials and the query cache.
