# Phase 8 — Security Card & Status

## Goal

Build the MFA security section: `MfaSecurityCard` shows the account's MFA status (enabled / disabled / unknown) and the two action buttons ("Enable MFA", "Disable MFA"). Status is derived **only** from data the backend already returns — the profile response — with an `unknown` fallback and optimistic flipping after mutations.

Spec reference: §6.2 (status derivation — no invented endpoints), §8.1 (responsibilities), §9.3 (`mfaEnabled` state).

## Depends On

- Phase 2 (`normalizeUser` MFA fields).
- Phase 7 (Settings page hosts the card).
- Backend confirmation Q3 (profile MFA fields) — the `unknown` path is the defensive default.

## Deliverables

- `src/components/mfa/SecurityCard.tsx` (new) — `MfaSecurityCard`.
- `src/components/mfa/MfaStatusBadge.tsx` (new).
- `src/components/mfa/MfaSetupButton.tsx` + `MfaDisableButton.tsx` (new).
- `MfaSecurityCard` mounted in `src/pages/Settings.tsx` (replaces the Phase 7 placeholder).
- i18n keys (en/ar/fa).

## Tasks

### Task 1 — Build `MfaStatusBadge`

**Description**

Create `src/components/mfa/MfaStatusBadge.tsx` with prop `status: "enabled" | "disabled" | "unknown"` (spec §8.1):

- Green badge "Enabled" for `enabled`, gray "Disabled" for `disabled`, gray "Unknown" for `unknown` (rendered only when the profile exposes MFA fields — spec §6.2).
- Use the existing `ui/badge.tsx` variants.

**Files**

- `src/components/mfa/MfaStatusBadge.tsx` (new)

**Dependencies**

- None

**Complexity**

Small

### Task 2 — Build the action buttons

**Description**

Create `src/components/mfa/MfaSetupButton.tsx` ("Enable MFA", opens `MfaSetupModal` in Phase 9 — for now just exposes the click) and `src/components/mfa/MfaDisableButton.tsx` ("Disable MFA", destructive variant, opens `MfaDisableModal` in Phase 11). Both accept `disabled?: boolean`.

**Files**

- `src/components/mfa/MfaSetupButton.tsx` (new)
- `src/components/mfa/MfaDisableButton.tsx` (new)

**Dependencies**

- None

**Complexity**

Small

### Task 3 — Build `MfaSecurityCard`

**Description**

Create `src/components/mfa/SecurityCard.tsx` (spec §6.2, §8.1):

- Local state `mfaEnabled: boolean | null` (`null` = unknown), seeded from `useProfile()` when the normalized user carries MFA fields; otherwise stays `null`.
- Render: section title, status row (badge + explanatory text), and action buttons — "Enable MFA" when not enabled, "Disable MFA" when enabled (when status is `unknown`, both actions are available, spec §6.2).
- Own the modal open flags: `setupOpen`, `disableOpen` (the modals mount here in Phases 9 and 11).
- Expose `setMfaEnabled(boolean | null)` so later phases can flip state after mutations.

**Files**

- `src/components/mfa/SecurityCard.tsx` (new)

**Dependencies**

- Tasks 1, 2, Phase 2 (`normalizeUser`)

**Complexity**

Medium

### Task 4 — Mount the card on the Settings page

**Description**

Replace the Phase 7 placeholder in `src/pages/Settings.tsx` with `<MfaSecurityCard />`.

**Files**

- `src/pages/Settings.tsx` (modified)

**Dependencies**

- Task 3

**Complexity**

Small

### Task 5 — Add i18n keys

**Description**

Add to `src/translations/{en,ar,fa}.json`: `mfa.statusEnabled`, `mfa.statusDisabled`, `mfa.statusUnknown`, `mfa.enableMfa`, `mfa.disableMfa`, `mfa.statusDescription` (and any status-explainer strings).

**Files**

- `src/translations/{en,ar,fa}.json` (modified)

**Dependencies**

- Tasks 1–3

**Complexity**

Small

## Acceptance Criteria

✓ The card renders on Settings with the correct status when the profile includes MFA fields.

✓ When the profile has **no** MFA fields, the card renders the `unknown` state gracefully (no crash, no fake status) with both actions available.

✓ "Enable MFA" and "Disable MFA" buttons render with correct variants; clicking sets the respective open flag (modal wiring arrives in Phases 9/11).

✓ Lint and build green.

## Manual Testing Checklist

- [ ] Logged-in user whose profile has no MFA fields → card shows `unknown`, both buttons visible.
- [ ] Temporarily simulate a profile with `mfa: { enabled: true }` (devtools or local mock) → badge shows "Enabled", only "Disable MFA" visible.
- [ ] Same with `enabled: false` → "Disabled", only "Enable MFA" visible.
- [ ] Buttons don't crash when clicked (open flag flips; no modal yet).
- [ ] All three locales render the card strings.
- [ ] Lint and build green.
