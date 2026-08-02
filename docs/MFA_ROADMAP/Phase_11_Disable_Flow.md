# Phase 11 — Disable Flow

## Goal

Implement disabling MFA: a confirmation dialog (password + current OTP) calls `POST /v1/auth/mfa/disable`, success shows a toast, the dialog closes, and the Security card flips to "disabled". **Disable MFA now works end-to-end** and the feature is complete.

Spec reference: §7.2 (dialog), §8.1 (responsibilities), §10.4 (disable contract), §13 (401/404/422/429 behavior), §16 (#11, #12), §12.1 (disable schema).

## Depends On

- Phase 1 (toast).
- Phase 3 (`mfaDisableRequest`, `getApiErrorCode`).
- Phase 5 (`otpSchema`, `OtpInput`).
- Phase 8 (`MfaSecurityCard` open flag + `setMfaEnabled`).

## Deliverables

- `createDisableMfaSchema` in `src/validations/mfa.ts`.
- `useMfaDisable` mutation in `src/hooks/useMfa.ts`.
- `src/components/mfa/MfaDisableModal.tsx` (new).
- Wiring in `MfaSecurityCard` (open flag + `onDisabled`).
- i18n keys (en/ar/fa).

## Tasks

### Task 1 — Create the disable validation schema

**Description**

In `src/validations/mfa.ts`, add (spec §12.1):

- `createDisableMfaSchema = (t) => z.object({ password: z.string().min(1, t("mfa.passwordRequired")), code: otpSchema(t) })`.

Follow the existing schema-factory pattern from `src/validations/auth.ts`.

**Files**

- `src/validations/mfa.ts` (modified)

**Dependencies**

- Phase 5 (`otpSchema`)

**Complexity**

Small

### Task 2 — Create `useMfaDisable` mutation

**Description**

Add `useMfaDisable()` to `src/hooks/useMfa.ts` (spec §9.1): `useMutation` whose `mutationFn` is `mfaDisableRequest` (`{ password, code }`).

**Files**

- `src/hooks/useMfa.ts` (modified)

**Dependencies**

- Phase 3 (`mfaDisableRequest`)

**Complexity**

Small

### Task 3 — Build `MfaDisableModal`

**Description**

Create `src/components/mfa/MfaDisableModal.tsx` (props `{ open, onOpenChange, onDisabled }`, spec §7.2, §8.1):

- Warning copy: "Disabling removes the extra security layer from your account."
- RHF form with `createDisableMfaSchema`: `Password` field (show/hide toggle, same pattern as `LoginForm`) + `OtpInput`.
- Submit button "Disable MFA" (destructive variant), disabled while `isDisabling` and during `Retry-After`.
- Error mapping (spec §13):
  - 401 wrong password → inline error on the password field; OTP cleared; dialog stays open.
  - 422 invalid code → inline error on the code; **only** the OTP clears, never the password (§16 #11).
  - 404 `MFA_NOT_ENABLED` → toast "MFA is already disabled", close, `onDisabled`.
  - 429 `MFA_RATE_LIMITED` → alert with the server message + `Retry-After` handling (§12.3).
- On 200 → success toast "Two-factor authentication disabled", close, `onDisabled`.

**Files**

- `src/components/mfa/MfaDisableModal.tsx` (new)

**Dependencies**

- Tasks 1, 2, Phase 1 (toast), Phase 5 (`OtpInput`)

**Complexity**

Medium

### Task 4 — Wire the dialog into the Security card

**Description**

In `src/components/mfa/SecurityCard.tsx`: render `<MfaDisableModal open={disableOpen} ... />` from the Phase 8 flag; `onDisabled` → `setMfaEnabled(false)` + `invalidateQueries({ queryKey: ["profile"] })` (spec §9.1).

**Files**

- `src/components/mfa/SecurityCard.tsx` (modified)

**Dependencies**

- Task 3, Phase 8

**Complexity**

Small

### Task 5 — Add i18n keys

**Description**

Add to `src/translations/{en,ar,fa}.json`: `mfa.disableTitle`, `mfa.disableWarning`, `mfa.passwordRequired`, `mfa.disableSubmit`, `mfa.disabledToast`, `mfa.alreadyDisabled`.

**Files**

- `src/translations/{en,ar,fa}.json` (modified)

**Dependencies**

- Tasks 1–4

**Complexity**

Small

## Acceptance Criteria

✓ Disabling with correct password + code: success toast → dialog closes → card flips to "Disabled".

✓ Wrong password → inline error on the password field, dialog stays open, OTP cleared.

✓ Wrong code → inline error on the code, password preserved, dialog stays open.

✓ 404 (already disabled, e.g. another tab) → toast + close + card flips to "Disabled".

✓ 429 disables the submit button for `Retry-After` seconds.

✓ No MFA secrets in `localStorage` at any point.

## Manual Testing Checklist

- [ ] Enable MFA (Phase 10), then disable with correct credentials — full round-trip works.
- [ ] Wrong password → error shown, password field keeps focus.
- [ ] Wrong code → error shown, password text is NOT cleared.
- [ ] Open the dialog from a second tab after disabling → 404 path: toast, close, state flips.
- [ ] Submit during an in-flight request is blocked (single request in network tab).
- [ ] Esc / X close without changes.
- [ ] Success toast appears once, then the badge flips to "Disabled".
- [ ] All three locales render the dialog strings.
- [ ] Lint and build green.
