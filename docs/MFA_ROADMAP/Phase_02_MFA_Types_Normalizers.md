# Phase 2 — MFA Types & Normalizers

## Goal

Create the complete type layer for the three MFA endpoints and make the existing login normalizer MFA-aware. After this phase, the codebase can *describe* every MFA response correctly — no API calls are made yet, but nothing throws on the new response shapes and the app still compiles.

Spec reference: §11.2 (types), §11.3 (login refactor), §6.2/§11.3 (`normalizeUser` extension), §10.1–10.4 (API contracts).

## Depends On

- None (pure type layer; follows `src/lib/payload.ts` normalizer conventions — `unwrapPayload`, `pickString`).

## Deliverables

- `src/types/mfa.ts` (new) — MFA types + normalizers.
- `src/types/auth.ts` (modified) — MFA-aware `LoginResponse` + `normalizeLoginResponse`.
- `src/types/user.ts` (modified) — defensive `mfa` field reading in `normalizeUser`.
- Green `tsc` build.

## Tasks

### Task 1 — Create `src/types/mfa.ts` with types and normalizers

**Description**

Define, exactly per spec §11.2 and §10.2/§10.3:

- `MfaSetup = { type: "totp"; issuer: string; label: string; secretBase32: string; qrcodePngBase64?: string; qrcodeDataUri: string }`
- `MfaSetupVerifyResponse = { enabled: boolean; verifiedAt?: string }`
- `MfaLoginVerifyResponse = { refreshToken: string; accessToken?: string; expiresIn?: number; sessionJti?: string; sessionId?: number; email?: string; role?: string; mfa?: { verified: boolean; methods: string[]; mfaVerifiedAt?: string } }`
- `MfaVerifyBody = { code: string; context: "setup" | "login"; mfa_token?: string }`

Implement `normalizeMfaSetup`, `normalizeSetupVerify`, `normalizeLoginVerify` using the existing `unwrapPayload` + `pickString` conventions from `src/lib/payload.ts`. No fields beyond the documented contracts may be read.

**Files**

- `src/types/mfa.ts` (new)

**Dependencies**

- `src/lib/payload.ts` (existing)

**Complexity**

Small

### Task 2 — Make `normalizeLoginResponse` MFA-aware

**Description**

Refactor `src/types/auth.ts` per spec §11.3:

- New `LoginResponse = { accessToken?: string; refreshToken?: string; mfaToken?: string; mfaRequired: boolean; user?: User | null }`.
- `normalizeLoginResponse` must **stop throwing** when `access_token` is absent (currently throws at `src/types/auth.ts:25`).
- Derive `mfaRequired: true` when `mfaToken` is present (accept keys `mfaToken` / `mfa_token`) **or** an explicit `mfa_required` flag is truthy.
- Keep normalizing the plain success case (both tokens) unchanged.

This is the contract note from spec §10.1: login may return `{ mfa_required: true, mfa_token }` with **no** `access_token`.

**Files**

- `src/types/auth.ts` (modified)

**Dependencies**

- Task 1 (style consistency only)

**Complexity**

Small

### Task 3 — Extend `normalizeUser` with defensive MFA fields

**Description**

Extend `normalizeUser` in `src/types/user.ts` to read `mfa` fields from the profile response **only when present**: `enabled`, `verified_at`/`verifiedAt`, `methods`. Everything optional; when absent the Security card will show `unknown` (spec §6.2). Do not invent fallback logic.

**Files**

- `src/types/user.ts` (modified)

**Dependencies**

- None

**Complexity**

Small

### Task 4 — Verify normalizers against sample payloads

**Description**

With the dev server running, temporarily call the three normalizers from a scratch file (or devtools) with the exact sample payloads from spec §10.1–10.3 and assert:

- Login payload A (`access_token` + `refresh_token`) → `mfaRequired: false`.
- Login payload B (`mfa_required: true`, `mfa_token`, no access token) → `mfaRequired: true`, **no throw**.
- Setup payload → `MfaSetup` with all camelCase fields.
- Verify payloads (setup + login) → correct response types.
- Profile with `mfa` block → fields read; without → absent.

Remove the scratch code afterwards.

**Files**

- Temporary scratch (reverted)

**Dependencies**

- Tasks 1–3

**Complexity**

Small

## Acceptance Criteria

✓ `pnpm build` (tsc) passes.

✓ `normalizeLoginResponse` returns `mfaRequired: true` for the MFA-challenge payload instead of throwing.

✓ All MFA normalizers produce the documented camelCase shapes.

✓ Existing login flow behavior is unchanged for the non-MFA payload.

## Manual Testing Checklist

- [ ] Log in with a non-MFA account — dashboard loads as before (no regression).
- [ ] Sample-payload checks from Task 4 all pass.
- [ ] Profile fetch still normalizes when the response has no `mfa` block.
- [ ] Lint clean (`pnpm lint`).
