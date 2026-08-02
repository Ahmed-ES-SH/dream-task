# Phase 10 — Enable Flow: Verify & Success

## Goal

Complete the enable wizard: after scanning, the user enters the 6-digit code (auto-submit), the modal verifies it via `POST /v1/auth/mfa/verify (context=setup)`, shows a success step, and the Security card flips to "enabled". **Enable MFA now works end-to-end.**

Spec reference: §7.1 (verify + success steps), §4.3 (state machine), §8.1 (responsibilities), §10.3 (verify contract), §16 (#2, #5, #10).

## Depends On

- Phase 5 (`MfaVerifyStep`, `OtpInput`, `useMfaVerify`).
- Phase 9 (modal shell + `setupData` + state machine).

## Deliverables

- `verify` step inside `MfaSetupModal` (renders shared `MfaVerifyStep` with `context="setup"`).
- `src/components/mfa/MfaSuccessStep.tsx` (new).
- Success wiring: card flips to enabled + `["profile"]` invalidation.
- i18n keys (en/ar/fa).

## Tasks

### Task 1 — Integrate the shared verify step into the modal

**Description**

In `src/components/mfa/MfaSetupModal.tsx`:

- Render `mfa/MfaVerifyStep` when `step === "verify"`, with `context="setup"` and a Back link → `step = "qr"` (§4.3).
- `onSuccess(result)` → if `result.enabled === true`, set `step = "success"` and keep `verifiedAt` (from `MfaSetupVerifyResponse`).
- The shared step already handles 422 (clear + retry), 429 (`Retry-After`), and auto-submit — no duplication (spec §8.1).
- Guard double-submit: `isVerifying` + disabled button (§16 #10).

**Files**

- `src/components/mfa/MfaSetupModal.tsx` (modified)

**Dependencies**

- Phase 5 (`mfa/MfaVerifyStep`), Phase 9

**Complexity**

Medium

### Task 2 — Build `MfaSuccessStep`

**Description**

Create `src/components/mfa/MfaSuccessStep.tsx` (props `{ verifiedAt?: string, onDone }`, spec §8.1):

- Static confirmation: check icon, "Two-factor authentication enabled", optional `verifiedAt` timestamp (no animation — §14).
- "Done" button → `onDone`.

**Files**

- `src/components/mfa/MfaSuccessStep.tsx` (new)

**Dependencies**

- None

**Complexity**

Small

### Task 3 — Wire success: close, flip state, invalidate profile

**Description**

In `src/components/mfa/MfaSetupModal.tsx`, emit `onEnabled(verifiedAt?)` from `onDone`. In `src/components/mfa/SecurityCard.tsx`:

- On `onEnabled` → `setMfaEnabled(true)` + `queryClient.invalidateQueries({ queryKey: ["profile"] })` (spec §9.1; harmless if the profile carries no MFA fields).

**Files**

- `src/components/mfa/MfaSetupModal.tsx` (modified)
- `src/components/mfa/SecurityCard.tsx` (modified)

**Dependencies**

- Task 2, Phase 8 (card state)

**Complexity**

Small

### Task 4 — Add i18n keys

**Description**

Add to `src/translations/{en,ar,fa}.json`: `mfa.successTitle`, `mfa.successDescription`, `mfa.successDone`, `mfa.verifyBack`, `mfa.enabledToast` (enable-success toast).

**Files**

- `src/translations/{en,ar,fa}.json` (modified)

**Dependencies**

- Tasks 1–3

**Complexity**

Small

## Acceptance Criteria

✓ Full enable flow: Enable MFA → QR → scan → 6-digit code → auto-submit → success step → Done → modal closes → card shows "Enabled".

✓ Wrong/expired code (422): input clears, inline error shows, retry allowed with the same QR/secret (no new setup call).

✓ Back link from the verify step returns to the QR step without re-fetching setup.

✓ Success does **not** navigate away — the user stays on Settings with the card flipped.

✓ `["profile"]` is invalidated on success.

## Manual Testing Checklist

- [ ] Enable flow end-to-end with a real authenticator app (e.g. Google Authenticator) — code accepted.
- [ ] Enter a wrong code → error, retry with a fresh code succeeds.
- [ ] Let a code expire (30 s boundary) → 422 "expired" message, new code works.
- [ ] Double-click Verify / double Enter → only one request in the network tab.
- [ ] Cancel on the verify step → silent close; account stays disabled (reopen → fresh setup).
- [ ] After Done, the badge flips to "Enabled" and only "Disable MFA" remains.
- [ ] Profile refetch happens after success (network tab).
- [ ] Lint and build green.
