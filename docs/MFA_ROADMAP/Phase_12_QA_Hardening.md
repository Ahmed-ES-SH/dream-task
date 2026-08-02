# Phase 12 — QA & Hardening

## Goal

Close the feature: everything from Phases 1–11 is in place — this phase verifies it as a whole, fixes anything found, and walks the full Definition of Done (spec §21). No new features are added.

Spec reference: §15 (accessibility), §16 (edge cases), §17 (checklist), §21 (Definition of Done).

## Depends On

- Phases 1–11 (all).

## Deliverables

- Clean `pnpm lint` + `pnpm build`.
- i18n key parity across `en`, `ar`, `fa`.
- All 19 spec §16 edge cases manually verified (or documented with a known cause).
- Accessibility pass per spec §15.
- Definition of Done checklist (spec §21) fully checked.

## Tasks

### Task 1 — Lint and build gate

**Description**

Run `pnpm lint` and `pnpm build` and fix every error and warning introduced across the phases. This is the gate every other task in this phase depends on.

**Files**

- Any files surfaced by lint/build

**Dependencies**

- Phases 1–11

**Complexity**

Small

### Task 2 — i18n parity audit

**Description**

Audit `src/translations/{en,ar,fa}.json`: every new MFA key (login challenge, settings, security card, setup modal, disable dialog, toasts) exists in **all three** locales with the same structure. Fix missing keys.

**Files**

- `src/translations/{en,ar,fa}.json`

**Dependencies**

- Task 1

**Complexity**

Small

### Task 3 — Edge-case pass (spec §16)

**Description**

Manually verify the 19 edge cases from spec §16, prioritizing: #3 (409 already enabled), #4 (expired `mfa_token`), #5 (TOTP expiry mid-submit), #6/#14 (429 with and without `Retry-After`), #7/#8 (refresh / back during challenge), #9 (paste sanitization), #10 (double-submit), #11/#12 (disable failures), #15 (QR fallback), #17 (session killed mid-setup → redirect to login), #19 (profile without MFA fields → `unknown`).

**Files**

- None expected (behavioral verification); fix files only if a case fails

**Dependencies**

- Task 1

**Complexity**

Medium

### Task 4 — Accessibility pass (spec §15)

**Description**

Verify per §15: focus moves to the first OTP cell on step entry; focus trap + return-to-trigger in both modals; Esc closes; visible labels and `aria-label`/`aria-describedby` on OTP groups; `aria-invalid` + `aria-live="polite"` on error regions; `role="status"` toasts; QR `alt` text; WCAG AA contrast on destructive alerts; `autoComplete="one-time-code"` on OTP inputs. Test with keyboard only and a screen reader (e.g. NVDA/VoiceOver).

**Files**

- Components only if a check fails

**Dependencies**

- Task 1

**Complexity**

Medium

### Task 5 — Definition of Done walkthrough (spec §21)

**Description**

Walk the 21-item checklist in spec §21 (enable, QR, secret, OTP UX, verify, disable, login challenge, handshake, `_skipRefresh`, `unknown` state, loading states, disabled buttons, success feedback, error handling per §13, secret-persistence ban, responsive layout, a11y, i18n, lint/build, edge cases). Each unchecked item becomes a fix task executed before this phase closes.

**Files**

- As needed per failed item

**Dependencies**

- Tasks 1–4

**Complexity**

Small

## Acceptance Criteria

✓ `pnpm lint` and `pnpm build` pass with zero errors.

✓ Every MFA string exists in all three locales.

✓ All 19 §16 edge cases behave per the spec table.

✓ Keyboard-only and screen-reader passes succeed for login challenge, setup modal, and disable dialog.

✓ The §21 Definition of Done checklist is fully checked — the feature is complete.

## Manual Testing Checklist

- [ ] Full regression: non-MFA login → dashboard (Scenario A) still works.
- [ ] Scenario B login → dashboard (Phase 6) still works.
- [ ] Enable → login challenge → disable round-trip (Phases 9–11) works from a fresh account.
- [ ] Two tabs open: enabling in one tab reflects in the other after refresh (server is source of truth).
- [ ] Slow network: all loading states visible; no double submits.
- [ ] Mobile viewport (< `sm`): setup modal full-width, QR ~200 px, inputs usable.
- [ ] Locale switch to `ar`/`fa` mid-modal → strings re-render, no state loss (§16 #18).
- [ ] Final lint + build green.
