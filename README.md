# Dream — Login & User Dashboard

A small React front-end for a login flow and a user dashboard, built with React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/ui (Base UI primitives), React Router v8, Axios, React Hook Form, Zod, TanStack Query, lucide-react icons, and the Geist Variable font.

## Features

- **Login page** — email + password with React Hook Form and Zod validation (localized messages), loading state, API error alert, show/hide password, responsive layout, redirects to the dashboard on success (and away from it when already signed in).
- **Register page** — static sign-up UI (not wired to the API yet).
- **Dashboard** — responsive layout with a fixed sidebar (desktop) and a top bar with a compact user menu (mobile).
- **User profile panel** — fetches the authenticated user (`GET /v1/core/users/me`) and shows full name, email, role, account status, member-since and last-login dates, with dedicated loading (skeleton), empty, and error (+ retry) states. Role and status values are mapped to translated labels.
- **Authentication** — access token + refresh token persisted in `localStorage` and attached as `Authorization: Bearer` on every request. On a `401` the app transparently refreshes the access token (single-flight with request queueing and refresh-token rotation), retries the failed request, and only signs the user out if the refresh itself fails.
- **Bonus**: TypeScript, dark mode (system-aware), RTL support (Arabic / Persian), three-locale i18n, lazy-loaded routes.

## Getting started

Requirements: Node.js 20.19+ (or 22.12+) and pnpm (recommended; the repo commits `pnpm-lock.yaml` — npm also works).

```bash
pnpm install or npm install
pnpm run dev or npm run dev
```

Open http://localhost:5173 (the root redirects to `/en`).

## Environment variables

Copy `.env.example` to `.env` if you need to configure the API:

```bash
cp .env.example .env
```

| Variable            | Description                                                    |
| ------------------- | -------------------------------------------------------------- |
| `VITE_API_BASE_URL` | Base URL of the backend API. **Required** for the app to work. |

## Connecting to a real API

1. Create `.env` with `VITE_API_BASE_URL=https://your-api.example.com`.
2. The app expects these endpoints (paths are in `src/constants/`):
   - `POST {base}/v1/auth/login` → `{ access_token, refresh_token, ... }` (envelopes like `{ ok: true, data: { ... } }` are unwrapped; `access_token`, `token`, or `jwt` are accepted)
   - `POST {base}/v1/auth/refresh` → new `access_token` (sent with the stored refresh token; the response may also rotate the refresh token)
   - `GET {base}/v1/core/users/me` (protected) → user object
   - `POST {base}/v1/auth/logout`
3. Response payloads are normalized in `src/lib/payload.ts` (`unwrapPayload`, `pickString`), `src/types/auth.ts`, and `src/types/user.ts`; `camelCase` and `snake_case` field names are both handled. If your backend uses a different envelope, adjust the normalizers there.
4. The constants files also declare endpoints that the UI **does not call yet**: `POST /v1/auth/register` (the register page is a static form), plus `POST /v1/core/users/me/profile-image/upload`, `DELETE /v1/core/users/me/profile-image`, and `POST /v1/core/me/password` (profile-image and password management are not implemented). You can skip these for now, or build them out — the paths are ready in `src/constants/auth.api.ts` and `src/constants/profile.api.ts`.

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
│   ├── auth/        # Gateway (decorative), LoginForm (RHF + Zod)
│   ├── dashboard/   # UserMenu, UserProfileCard, ProfileCardSkeleton, ProfileInfoItem, ProfileStatusBadge
│   ├── theme/       # ThemeToggle
│   ├── ui/          # shadcn/ui components (Base UI primitives)
│   └── website/     # Navbar, Footer, HeroSection, LocaleLink
├── constants/       # API endpoint paths (auth.api, profile.api), label maps (profile)
├── hooks/           # useLoginForm, useProfile, useLocale, useTranslations, useClickOutside
├── layouts/         # WebsiteLayout, DashboardLayout, LocaleGuard
├── lib/             # api (axios client + auth), payload (normalizers), queryClient, theme, format, profile, utils
├── pages/           # Home, Login, Register, Dashboard
├── routes/          # router definition (lazy-loaded routes), ProtectedRoute
├── store/           # AuthProvider / useAuth
├── translations/    # en / ar / fa locale files
├── types/           # auth, user & profile types + response normalizers
└── validations/     # form schemas (zod)
```

## Approach

- **Auth flow**: an `AuthProvider` holds the session state. On login the access and refresh tokens are stored in `localStorage` and an axios request interceptor attaches the access token to every request (except the refresh call itself). A response interceptor handles `401`s by running a single-flight refresh (concurrent `401`s are queued and resolved with one new token), retries the original request with the fresh token, and only clears the session and emits the `auth:unauthorized` event when the refresh fails — which the provider listens to in order to sign the user out and clear the profile cache.
- **Data fetching**: TanStack Query drives the profile panel (shared `QueryClient` in `src/lib/queryClient.ts`), giving us loading/error/empty states and caching out of the box; the `["profile"]` query is removed on logout/unauthorized.
- **Form logic separation**: validation schemas live in `src/validations/auth.ts` (built with the locale-aware translator), form business logic (state + submit) in `src/hooks/useLoginForm.ts`, and `src/components/auth/LoginForm.tsx` is UI-only.
- **i18n/RTL**: routes are locale-prefixed (`/en`, `/ar`, `/fa`); `LocaleGuard` validates the locale and switches the document's `lang`/`dir` automatically for RTL locales; the layout uses logical CSS properties throughout. Pages are code-split per route with React Router's `lazy()`.
