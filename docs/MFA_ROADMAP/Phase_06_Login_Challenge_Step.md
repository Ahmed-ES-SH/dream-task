# Phase 6 — Login Challenge Step

## Goal

Complete **Scenario B end-to-end**: a user with MFA enabled logs in, lands on the code-entry step on the same `/login` route, enters a valid code, and reaches the dashboard. This is the first user-facing milestone of the feature.

Spec reference: §6.1 (login page), §11.5 (token handshake), §4.2 (state machine), §8.1 (`auth/MfaVerifyStep` responsibilities), §10.3 (verify contract).

## Depends On

- Phase 4 (auth store `LoginResult` + `completeLoginWithMfa`, `useLoginForm` step machine).
- Phase 5 (`OtpInput`, `mfa/MfaVerifyStep`, `otpSchema`, `useMfaVerify`).
- Backend confirmation Q1/Q2 (signal shape, access token at login-verify) — defensive defaults apply.

## Deliverables

- `src/components/auth/MfaVerifyStep.tsx` (new) — the login-page challenge step.
- Token handshake logic for the login-verify response (spec §11.5).
- `src/pages/Login.tsx` wiring: challenge step replaces the Phase 4 placeholder.
- i18n keys (en/ar/fa).

## Tasks

### Task 1 — Build the login challenge step wrapper

**Description**

Create `src/components/auth/MfaVerifyStep.tsx` (spec §6.1, §8.1) with props `{ email, mfaToken, onSuccess, onBack }`:

- Title "Two-factor authentication" + description ("Enter the 6-digit code from your authenticator app").
- The masked email (`u***@domain.com` — first character + `***` + domain part) with a "Not you?" link → `onBack` (returns to credentials).
- Renders `mfa/MfaVerifyStep` with `context="login"` and `mfaToken`.
- "Back to sign in" ghost link → `onBack`.
- All strings via `useTranslations`.

**Files**

- `src/components/auth/MfaVerifyStep.tsx` (new)

**Dependencies**

- Phase 5 (`mfa/MfaVerifyStep`)

**Complexity**

Medium

### Task 2 — Implement the login-verify token handshake

**Description**

Implement spec §11.5:

1. `mfaVerifyRequest(..., "login")` returns the normalized `MfaLoginVerifyResponse`.
2. If it **includes** `accessToken` → store both tokens, finish.
3. If it only has `refreshToken` → store the refresh token, then call the existing refresh path **once** to mint the access token (reuse the `refreshAccessToken` logic in `src/lib/api.ts:92`).
4. Keep this flagged as an assumption (open question Q2): if the backend returns an access token at login-verify, step 3 never triggers.

Put the handshake in a small helper (e.g. `completeLoginWithMfa` flow in `src/store/auth.tsx` or a helper in `src/lib/api.ts`) so Task 3 stays thin.

**Files**

- `src/store/auth.tsx` and/or `src/lib/api.ts` (modified)

**Dependencies**

- Phase 4, Phase 3 (wrappers)

**Complexity**

Medium

### Task 3 — Wire the challenge step into the login page

**Description**

In `src/pages/Login.tsx`: replace the Phase 4 placeholder with the real `auth/MfaVerifyStep`, passing `loginEmail`, `mfaToken`, `onSuccess` (→ run the Task 2 handshake → `completeLoginWithMfa` → navigate `/dashboard`), and `onBack` (→ `resetToCredentials()`, discarding `mfaToken`). The `mfa_token` stays in memory only.

**Files**

- `src/pages/Login.tsx` (modified)

**Dependencies**

- Tasks 1, 2

**Complexity**

Small

### Task 4 — Add i18n keys

**Description**

Add to `src/translations/{en,ar,fa}.json`: `login.mfaTitle`, `login.mfaDescription`, `login.mfaNotYou`, `mfa.backToSignIn` (per spec §17 Phase 1 key list). No hardcoded strings in the new components.

**Files**

- `src/translations/{en,ar,fa}.json` (modified)

**Dependencies**

- Task 1

**Complexity**

Small

## Acceptance Criteria

✓ A user with MFA enabled: enters credentials → code step appears (masked email shown) → valid code → lands on `/dashboard` with tokens stored.

✓ Wrong code → inline error, input cleared, retry allowed (no redirect, no sign-out).

✓ Expired `mfa_token` (401) → alert + return to the credentials step; **no** refresh attempt and **no** wrongful logout (§11.5).

✓ "Not you?" and "Back to sign in" discard the `mfa_token` and return to credentials.

✓ `mfa_token` never appears in `localStorage`/URL.

## Manual Testing Checklist

- [ ] Scenario B happy path: email+password → code → dashboard.
- [ ] Wrong code twice → both attempts show inline errors; third correct attempt succeeds.
- [ ] Refresh the page during the challenge step → login restarts (documented behavior).
- [ ] Back/forward navigation during the challenge step → `mfa_token` discarded, login restarts.
- [ ] Network tab: login-verify 401 does **not** produce an auth/refresh call.
- [ ] Paste a 6-digit code — auto-submits.
- [ ] Screen reader: title/description/errors announced (`aria-live`).
- [ ] Lint and build green.
