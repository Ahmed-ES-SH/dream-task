# Phase 7 — Settings Page & Route

## Goal

Create the protected Settings page shell that will host the MFA security section: a new nested route `/:locale/dashboard/settings` behind `ProtectedRoute` + `DashboardLayout`, reachable from a new "Settings" item in the user menu. The Security card itself lands in Phase 8.

Spec reference: §6.2 (Settings page), §6.3 (route ownership), §14 (UX decisions).

## Depends On

- None (route/`ProtectedRoute`/`UserMenu` all exist).

## Deliverables

- `src/pages/Settings.tsx` (new) — page with header + placeholder Security section.
- Route added in `src/routes/index.tsx`.
- "Settings" item in `src/components/dashboard/UserMenu.tsx`.
- i18n keys (en/ar/fa).

## Tasks

### Task 1 — Create the Settings page

**Description**

Create `src/pages/Settings.tsx` (spec §6.2): page header ("Settings") and a "Security" section that renders a temporary placeholder text ("Security settings" — replaced by `MfaSecurityCard` in Phase 8). Follow the existing dashboard page conventions (`Dashboard.tsx` style, `useTranslations()`).

**Files**

- `src/pages/Settings.tsx` (new)

**Dependencies**

- None

**Complexity**

Small

### Task 2 — Register the protected route

**Description**

In `src/routes/index.tsx`, add the nested route `:locale/dashboard/settings` under `DashboardLayout` + `ProtectedRoute` (spec §6.3: protected because all MFA mutations need a Bearer token). Confirm unauthenticated users are redirected to login.

**Files**

- `src/routes/index.tsx` (modified)

**Dependencies**

- Task 1

**Complexity**

Small

### Task 3 — Add the "Settings" item to the user menu

**Description**

Add a "Settings" item to `src/components/dashboard/UserMenu.tsx` linking to the new route (locale-aware link, consistent with existing menu items and icon usage).

**Files**

- `src/components/dashboard/UserMenu.tsx` (modified)

**Dependencies**

- Task 2

**Complexity**

Small

### Task 4 — Add i18n keys

**Description**

Add to `src/translations/{en,ar,fa}.json`: `settings.title`, `settings.securityTitle`, `settings.securityDescription` (or equivalent names used by the page).

**Files**

- `src/translations/{en,ar,fa}.json` (modified)

**Dependencies**

- Task 1

**Complexity**

Small

## Acceptance Criteria

✓ `/en/dashboard/settings` renders the Settings page with a header and Security section placeholder.

✓ The route is unreachable without authentication (redirect to login).

✓ The user menu contains a "Settings" item that navigates to the page.

✓ Lint and build green.

## Manual Testing Checklist

- [ ] Logged in: open the user menu → Settings → page renders.
- [ ] Logged out: direct navigation to `/en/dashboard/settings` → redirected to login.
- [ ] Locale switch (`/ar/...`, `/fa/...`) renders the page with translated strings.
- [ ] Reload on the settings URL → page still loads (reload-safe, no modal state needed).
- [ ] Lint clean.
