# Phase 3 — MFA API Requests

## Goal

Wire the four documented endpoints into the axios layer: constants, typed request wrappers, the error-code helper, and the 401-interceptor skip-list fix for login-context verify. After this phase the app can *call* every MFA endpoint — no UI uses them yet.

Spec reference: §11.1 (constants), §11.4 (wrappers), §11.5 (interceptor), §13 (error-code helper).

## Depends On

- Phase 2 (wrappers return the Phase 2 types).

## Deliverables

- MFA constants in `src/constants/auth.api.ts`.
- `getApiErrorCode` helper next to `getApiErrorMessage`.
- Three wrappers in `src/lib/api.ts`: `mfaSetupRequest`, `mfaVerifyRequest`, `mfaDisableRequest`.
- 401 interceptor skip-list extended for login-context verify (`_skipRefresh` flag).

## Tasks

### Task 1 — Add MFA endpoint constants

**Description**

Add to `src/constants/auth.api.ts` (exactly per spec §11.1 — no other MFA endpoints exist):

- `MFA_SETUP: "/v1/auth/mfa/setup"`
- `MFA_VERIFY: "/v1/auth/mfa/verify"`
- `MFA_DISABLE: "/v1/auth/mfa/disable"`

**Files**

- `src/constants/auth.api.ts` (modified)

**Dependencies**

- None

**Complexity**

Small

### Task 2 — Add `getApiErrorCode` helper

**Description**

Next to the existing `getApiErrorMessage` helper, add `getApiErrorCode(error)` that reads the backend error code from the response payload using the keys `["code", "errorCode", "error_code"]` via `pickString` (spec §13). Components in later phases branch on codes like `MFA_ALREADY_ENABLED`, `MFA_NOT_ENABLED`, `MFA_RATE_LIMITED`.

**Files**

- The file hosting `getApiErrorMessage` (e.g. `src/lib/api.ts` or its error-helper module)

**Dependencies**

- None

**Complexity**

Small

### Task 3 — Create the three MFA request wrappers

**Description**

In `src/lib/api.ts`, add (spec §11.4):

- `mfaSetupRequest(): Promise<MfaSetup>` — `POST` `MFA_SETUP` with body `{ issuer: "MAYA", label: "<email>" }`; the `label` value comes from the caller (profile email). Bearer token is attached automatically by the existing interceptor.
- `mfaVerifyRequest(body: MfaVerifyBody): Promise<MfaSetupVerifyResponse | MfaLoginVerifyResponse>` — `POST` `MFA_VERIFY`; body per `MfaVerifyBody`. **When `context === "login"`**, set the custom `_skipRefresh: true` flag on the axios config (needed by Task 4) and normalize with `normalizeLoginVerify`; for `context === "setup"`, normalize with `normalizeSetupVerify`.
- `mfaDisableRequest(body: { password: string; code: string }): Promise<void>` — `POST` `MFA_DISABLE`.

**Files**

- `src/lib/api.ts` (modified)

**Dependencies**

- Task 1, Phase 2 (`src/types/mfa.ts`)

**Complexity**

Medium

### Task 4 — Extend the 401 interceptor skip-list for login-context verify

**Description**

The existing 401 refresh interceptor (`src/lib/api.ts:92-157`) must **not** attempt a token refresh for login-context `mfa/verify` — a 401 there means "challenge expired", not "session invalid" (spec §11.5). Extend the skip logic so a request is excluded when it targets `/auth/mfa/verify` **and** carries `_skipRefresh: true` (set in Task 3). On that path, surface the 401 to the caller — do **not** sign the user out.

**Files**

- `src/lib/api.ts` (modified — interceptor)

**Dependencies**

- Task 3

**Complexity**

Medium

### Task 5 — Verify wrappers against a live backend

**Description**

Temporarily call `mfaSetupRequest` from a dev-only page (or devtools with a logged-in session) and confirm: the request carries `Authorization: Bearer`, the response normalizes to `MfaSetup`, and a successful `mfaVerifyRequest({ code: "000000", context: "setup" })` fails with 422 (as expected for a wrong code) rather than throwing a normalization error. Remove the temporary code afterwards.

**Files**

- Temporary scratch (reverted)

**Dependencies**

- Tasks 3, 4

**Complexity**

Small

## Acceptance Criteria

✓ `pnpm lint` and `pnpm build` pass.

✓ All three wrappers exist with the documented signatures and body shapes.

✓ Login-context verify calls carry `_skipRefresh` and are skipped by the 401 refresh interceptor.

✓ A wrong-code setup verify returns the server 422 error intact (no interceptor interference).

✓ Existing login/refresh behavior is unchanged.

## Manual Testing Checklist

- [ ] Live backend call to `mfa/setup` succeeds with a Bearer token and normalizes to `MfaSetup`.
- [ ] `mfaVerifyRequest` with a wrong code surfaces the 422 message from the server.
- [ ] After a successful login, refresh still works (interceptor untouched for normal requests).
- [ ] 401 from login-context verify does not trigger a refresh call in the network tab.
- [ ] Lint clean.
