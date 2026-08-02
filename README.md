# FlickHQ — Login & User Dashboard

A small React front-end for a login flow and a user dashboard, built with React, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Router, Axios, React Hook Form, Zod, and TanStack Query.

## Features

- **Login page** — email + password with React Hook Form and Zod validation, loading state, API error alert, show/hide password, responsive layout, redirect to the dashboard on success.
- **Dashboard** — responsive layout with a sidebar (desktop) and a top bar (mobile), page title, and a logout menu.
- **User profile panel** — fetches the authenticated user (`GET /v1/core/users/me`) and shows full name, email, role, account status, member-since and last-login dates, with dedicated loading, empty, and error (+ retry) states.
- **Authentication** — protected dashboard route, locale-aware redirects for unauthenticated users, token persisted in `localStorage`, attached as `Authorization: Bearer` on every request, cleared on logout or a `401` response.
- **Bonus**: TypeScript, dark mode toggle, RTL support (Arabic / Persian), three-locale i18n, mock API fallback.

## Getting started

Requirements: Node.js 20+ and pnpm (or npm).

```bash
npm install
npm run dev
```

Open http://localhost:5173 (the root redirects to `/en`).

## Environment variables

Copy `.env.example` to `.env` if you need to configure the API:

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL of the backend API. Leave **unset** to run in mock mode. |
| `VITE_MOCK_API` | Set to `true` to force mock mode even when a base URL is set. |

### Mock mode (no backend required)

With `VITE_API_BASE_URL` unset, the app runs against a built-in mock that simulates network latency. Use these demo credentials on the login page:

```
Email:    demo@example.com
Password: demo1234
```

Any other credentials produce a `401`-style error message so you can see the error state.

## Connecting to a real API

1. Create `.env` with `VITE_API_BASE_URL=https://your-api.example.com`.
2. The app expects these endpoints (paths are in `src/constants/`):
   - `POST {base}/v1/auth/login` → `{ access_token }` (token, `access_token`, or `jwt` are accepted)
   - `GET {base}/v1/core/users/me` (protected) → user object
   - `POST {base}/v1/auth/logout`
3. Response payloads are normalized in `src/types/auth.ts` and `src/types/user.ts`; `camelCase` and `snake_case` field names are both handled. If your backend uses a different envelope, adjust the normalizers there.

## Scripts

```bash
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run lint     # ESLint
npm run preview  # preview the production build
```

## Project structure

```
src/
├── components/
│   ├── auth/        # LoginForm (RHF + Zod)
│   ├── dashboard/   # UserProfileCard, UserMenu
│   ├── theme/       # ThemeToggle
│   ├── ui/          # shadcn/ui components
│   └── website/     # Navbar, Footer, LocaleLink
├── constants/       # API endpoint paths
├── hooks/           # useAuth-derived hooks, i18n, profile query
├── layouts/         # WebsiteLayout, DashboardLayout, LocaleGuard
├── lib/             # axios client, mock API, theme, formatting helpers
├── pages/           # Home, Login, Register, Dashboard
├── routes/          # router definition, ProtectedRoute
├── store/           # AuthProvider / useAuth
├── translations/    # en / ar / fa locale files
└── types/           # auth & user types + response normalizers
```

## Approach

- **Auth flow**: an `AuthProvider` holds the session state. On login the token is stored in `localStorage` and an axios request interceptor attaches it to every request. A response interceptor clears the session and emits an event on `401` (excluding the login endpoint itself), so protected routes automatically redirect.
- **Data fetching**: TanStack Query drives the profile panel, giving us loading/error/empty states and caching out of the box.
- **Mock first**: until the real API details are provided, the app runs fully standalone in mock mode; switching to a real backend is a one-line env change.
- **i18n/RTL**: routes are locale-prefixed (`/en`, `/ar`, `/fa`); `dir` is switched automatically for RTL locales and the layout uses logical CSS properties throughout.
