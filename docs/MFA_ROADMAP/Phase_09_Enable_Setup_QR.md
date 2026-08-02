# Phase 9 — Enable Flow: Setup & QR

## Goal

Build the first half of the enable wizard: the modal opens from the Security card, fetches a fresh TOTP setup, and presents the QR code + manual secret to the user — with loading, error/retry, and silent-cancel behavior. Verification of the code lands in Phase 10.

Spec reference: §7.1 (modal + steps), §4.3 (state machine), §8.1 (responsibilities), §10.2 (setup contract), §13 (409/500 behavior), §16 (#1, #2, #3, #15, #16).

## Depends On

- Phase 1 (`ui/dialog.tsx`, toast).
- Phase 3 (`mfaSetupRequest`, `getApiErrorCode`).
- Phase 8 (`MfaSecurityCard` open flags + `setMfaEnabled`).
- Backend confirmation Q4 (fresh secret per call) — always re-call setup on open.

## Deliverables

- `src/hooks/useMfa.ts` — `useMfaSetup` mutation (added to the Phase 5 hooks file).
- `src/components/mfa/MfaSetupModal.tsx` (new) — wizard shell + state machine (`loading → qr → verify → success`).
- `src/components/mfa/MfaQrStep.tsx` (new) — QR + secret + copy + continue.
- Modal mounted in `MfaSecurityCard` (open flag wiring).
- i18n keys (en/ar/fa).

## Tasks

### Task 1 — Create `useMfaSetup` mutation

**Description**

Add `useMfaSetup()` to `src/hooks/useMfa.ts` (spec §9.1): a `useMutation` whose `mutationFn` calls `mfaSetupRequest()`. The modal invokes it on open.

**Files**

- `src/hooks/useMfa.ts` (modified)

**Dependencies**

- Phase 3 (`mfaSetupRequest`)

**Complexity**

Small

### Task 2 — Build the setup modal shell + state machine

**Description**

Create `src/components/mfa/MfaSetupModal.tsx` (props `{ open, onOpenChange }`, spec §7.1, §4.3):

- Wizard state `step: "loading" | "qr" | "verify" | "success"` (default `"loading"`) plus `setupData`, `setupError`, `isLoadingSetup`.
- On open: run `useMfaSetup` with body `{ issuer: "MAYA", label: <profile email> }` (email from `useProfile()`).
  - 200 → `step = "qr"`, hold `setupData`.
  - 500 `MFA_QR_NOT_AVAILABLE` / other failure → `step = "error"` view with alert + "Try again" (re-runs setup) and a close option.
  - 409 `MFA_ALREADY_ENABLED` → close modal, toast "MFA is already enabled", call `onAlreadyEnabled` (Phase 10 wires the state flip).
  - 401 session expired → let the interceptor refresh; if it bubbles through, surface it (logout flow via existing `auth:unauthorized`).
- Silent cancel at any step: X / Esc / backdrop → close, **no API call**, account stays disabled (§16 #1/#2).
- Wrap in `ui/dialog.tsx` (base-ui handles focus trap + Esc).

**Files**

- `src/components/mfa/MfaSetupModal.tsx` (new)

**Dependencies**

- Task 1, Phase 1 (`Dialog`), Phase 2 (`MfaSetup` type)

**Complexity**

Medium

### Task 3 — Build `MfaQrStep`

**Description**

Create `src/components/mfa/MfaQrStep.tsx` (props `{ setup: MfaSetup, onContinue }`, spec §8.1, §10.2):

- QR image: `<img src={setup.qrcodeDataUri}>`; if the data URI is missing but `qrcodePngBase64` exists, build `data:image/png;base64,...` (§16 #15); if neither → secret-only step with a warning.
- Secret: read-only grouped input `XXXX XXXX XXXX XXXX` (from `secretBase32`) + Copy button with "Copied ✓" transient feedback (no toast spam, §14).
- Warning copy: "If you lose this code you cannot sign in."
- Primary action "I've scanned the QR" → `onContinue` → `step = "verify"`.

**Files**

- `src/components/mfa/MfaQrStep.tsx` (new)

**Dependencies**

- Task 2 (rendered inside the modal)

**Complexity**

Medium

### Task 4 — Mount the modal in the Security card

**Description**

In `src/components/mfa/SecurityCard.tsx`: render `<MfaSetupModal open={setupOpen} onOpenChange={...} />` wired to the Phase 8 open flag, plus `onAlreadyEnabled` → `setMfaEnabled(true)`.

**Files**

- `src/components/mfa/SecurityCard.tsx` (modified)

**Dependencies**

- Tasks 2, 3, Phase 8

**Complexity**

Small

### Task 5 — Add i18n keys

**Description**

Add to `src/translations/{en,ar,fa}.json`: `mfa.setupTitle`, `mfa.setupLoading`, `mfa.setupRetry`, `mfa.alreadyEnabled`, `mfa.scannedQr`, `mfa.copySecret`, `mfa.copied`, `mfa.secretWarning`, `mfa.qrAlt` (QR `alt` text per §15).

**Files**

- `src/translations/{en,ar,fa}.json` (modified)

**Dependencies**

- Tasks 2–4

**Complexity**

Small

## Acceptance Criteria

✓ Clicking "Enable MFA" opens the modal, shows a loading state, then renders the QR + secret.

✓ QR renders from `qrcode_data_uri` (fallback path works when only `png_base64` exists).

✓ Secret displays grouped and copies with "Copied ✓" feedback.

✓ Cancel (X / Esc / backdrop) at the loading or QR step closes silently with no API call.

✓ Setup failure shows the error state with "Try again" re-running the request.

✓ 409 closes the modal with an "already enabled" toast and flips the card state.

✓ Modal is mobile-friendly (full-width below `sm`, QR ~200 px, §16 #16).

## Manual Testing Checklist

- [ ] Enable MFA → spinner → QR appears (scans into an authenticator app).
- [ ] Copy button copies `secret_base32` exactly (paste into a notes app to verify).
- [ ] Close on the QR step → reopen → a fresh setup request is issued (per Q4 default).
- [ ] Simulate 500 (`MFA_QR_NOT_AVAILABLE`) → error state → "Try again" recovers.
- [ ] Simulate 409 → modal closes, toast shows, card flips to enabled.
- [ ] Esc and backdrop close; focus is trapped while open; focus returns to the button on close.
- [ ] Screen reader: QR `alt` and secret label announced.
- [ ] Lint and build green.
