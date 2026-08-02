# Phase 4 — Auth Store & Login Form Restructure

## Goal

Restructure authentication state so the app can *represent* an MFA challenge: `login()` returns a discriminated result instead of throwing, a new `completeLoginWithMfa` completes a challenged login, and the login page becomes a two-step machine (`credentials` → `mfa`). The challenge UI itself is a placeholder here — it lands in Phase 6.

Spec reference: §9.2 (auth store), §6.1 (login page), §4.1/§4.2 (state machine), §9.3 (state inventory).

## Depends On

- Phase 2 (MFA-aware `LoginResponse` / `LoginResult` types).

## Deliverables

- `src/store/auth.tsx`: `LoginResult` type, `login()` returning it, new `completeLoginWithMfa()`.
- `src/hooks/useLoginForm.ts`: `step` / `mfaToken` / `loginEmail` state; branches on `LoginResult`.
- `src/pages/Login.tsx`: renders the `mfa` step branch (placeholder until Phase 6).
- Green build with no other login-flow regression.

## Tasks

### Task 1 — Refactor the auth store login flow

**Description**

In `src/store/auth.tsx`, per spec §9.2:

- Define `type LoginResult = { status: "authenticated" } | { status: "mfa_required"; mfaToken: string }`.
- Change `login()` to return `Promise<LoginResult>`: on a successful non-MFA login, store tokens and return `{ status: "authenticated" }`; when `mfaRequired` is true, return `{ status: "mfa_required", mfaToken }` **without** storing any token.
- `login()` throws only for real failures (401/422/network) — never for the challenge case.
- Add `completeLoginWithMfa(result: MfaLoginVerifyResponse): void` that stores the tokens and flips `isAuthenticated` (mirrors the body of today's successful `login`).

`mfaToken` is **memory-only** — it must never reach `localStorage` (spec §9.3 rule).

**Files**

- `src/store/auth.tsx` (modified)

**Dependencies**

- Phase 2 (`LoginResponse`, `MfaLoginVerifyResponse`)

**Complexity**

Medium

### Task 2 — Add the step machine to `useLoginForm`

**Description**

In `src/hooks/useLoginForm.ts` (spec §6.1, §9.3):

- Add state: `step: "credentials" | "mfa"` (default `"credentials"`), `mfaToken: string | null`, `loginEmail: string`.
- On submit success, branch on the `LoginResult`: `"authenticated"` → behave as today (redirect to dashboard); `"mfa_required"` → store `mfaToken` + `loginEmail` in memory, set `step = "mfa"`.
- Add a `resetToCredentials()` helper that discards `mfaToken` and sets `step = "credentials"` (used by "Not you?" / "Back to sign in" in Phase 6).

**Files**

- `src/hooks/useLoginForm.ts` (modified)

**Dependencies**

- Task 1

**Complexity**

Medium

### Task 3 — Render the `mfa` step branch on the login page

**Description**

In `src/pages/Login.tsx`: when `step === "mfa"`, render a temporary placeholder panel (title text "Two-factor authentication" + note that the challenge UI ships in Phase 6) instead of the credentials form. The placeholder is replaced in Phase 6 — keep the render branch cleanly separated.

**Files**

- `src/pages/Login.tsx` (modified)

**Dependencies**

- Task 2

**Complexity**

Small

## Acceptance Criteria

✓ `pnpm lint` and `pnpm build` pass.

✓ `login()` with an MFA-enabled account returns `{ status: "mfa_required", mfaToken }` — it does **not** throw and stores nothing.

✓ `login()` with a non-MFA account returns `{ status: "authenticated" }` and logs the user in exactly as before.

✓ The login page switches to the placeholder step for challenged logins; "wrong credentials" still shows the error alert.

✓ `completeLoginWithMfa` exists and flips `isAuthenticated` when called.

## Manual Testing Checklist

- [ ] Non-MFA login → dashboard (no regression).
- [ ] Wrong password → error alert, no state change.
- [ ] MFA-enabled login → placeholder step appears; tokens are **not** in `localStorage`.
- [ ] Refresh the page on the `mfa` step → login starts over (memory-only `mfaToken`, expected).
- [ ] Lint clean.
