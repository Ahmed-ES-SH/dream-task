# Phase 5 — OTP Input & Shared Verify Step

## Goal

Build the two reusable pieces of OTP UX: the segmented `OtpInput` and the shared `MfaVerifyStep` component (code entry + submit + inline errors + rate-limit handling). Both are context-agnostic and get used by the login challenge (Phase 6) and the enable wizard (Phase 10).

Spec reference: §12.1 (otpSchema), §12.2 (OtpInput rules), §12.3 (expiry & rate limiting), §8.1 (responsibilities), §7.1 (verify step).

## Depends On

- Phase 3 (`mfaVerifyRequest`, `getApiErrorCode`).

## Deliverables

- `src/validations/mfa.ts` (new) — `otpSchema`.
- `src/components/mfa/OtpInput.tsx` (new).
- `src/components/mfa/MfaVerifyStep.tsx` (new) — shared verify step.
- `src/hooks/useMfa.ts` (new) — `useMfaVerify` mutation.
- i18n keys for code errors (en/ar/fa).

## Tasks

### Task 1 — Create `otpSchema`

**Description**

Create `src/validations/mfa.ts` with (spec §12.1):

- `otpSchema = (t: Translator) => z.string().regex(/^\d{6}$/, t("mfa.codeInvalid"))`.

Follow the existing `src/validations/auth.ts` pattern (`Translator` from `@/hooks/useTranslations`).

**Files**

- `src/validations/mfa.ts` (new)

**Dependencies**

- None

**Complexity**

Small

### Task 2 — Build `OtpInput`

**Description**

Create `src/components/mfa/OtpInput.tsx` (props: `value`, `onChange`, `error?`, `disabled?`, `autoFocus?`) implementing every rule from spec §12.2:

- 6 segmented inputs, `maxLength=1`, hidden per-cell labels + single `aria-label="Authentication code"`, `inputMode="numeric"`, `autoComplete="one-time-code"`.
- Auto-advance to `i+1` on typing; `Backspace` on an empty cell moves to `i-1`; `ArrowLeft/Right/Home/End` navigate; `Delete` clears the current cell.
- Container-level `onPaste`: strip non-digits, take the first 6, distribute, focus the last, and trigger the submit callback when 6 valid digits are present.
- Auto-submit callback when 6 digits complete (unless `disabled`).
- Digits only; letter keys prevented.
- On error: clear all cells and refocus cell 0.
- Disabled state: greyed cells, `aria-disabled`.

**Files**

- `src/components/mfa/OtpInput.tsx` (new)

**Dependencies**

- None

**Complexity**

Medium

### Task 3 — Create `useMfaVerify` mutation

**Description**

Create `src/hooks/useMfa.ts` (spec §9.1) exposing `useMfaVerify()` — a TanStack Query `useMutation` whose `mutationFn` is `mfaVerifyRequest`. The component decides the `context`/`mfa_token` per call site.

**Files**

- `src/hooks/useMfa.ts` (new)

**Dependencies**

- Phase 3 (`mfaVerifyRequest`)

**Complexity**

Small

### Task 4 — Build the shared `MfaVerifyStep`

**Description**

Create `src/components/mfa/MfaVerifyStep.tsx` (spec §8.1, §7.1) with props `{ context: "setup" | "login"; mfaToken?: string; onSuccess: (result: MfaSetupVerifyResponse | MfaLoginVerifyResponse) => void; onBack?: () => void }`:

- Renders `OtpInput` (RHF `useForm` with `otpSchema` or controlled local state — follow the existing form conventions), a submit button, and an inline error region with `aria-live="polite"`.
- Runs `useMfaVerify` with the right body: `{ code, context }` (+ `mfa_token` when `context === "login"`).
- Auto-submit at 6 digits (per Task 2) unless `isVerifying` or `retryAfterSeconds > 0`.
- Error behavior (spec §12.3, §13): 422 → clear input, show `mfa.codeExpired`/`mfa.codeInvalid` from `getApiErrorMessage`, allow immediate retry; 429 → show `mfa.rateLimited`, and if the `Retry-After` header exists, store `retryAfterSeconds` and disable submit until it elapses with a single `setTimeout` (no ticker); if absent, allow retry after dismissal.
- Emits `onSuccess(result)`.

**Files**

- `src/components/mfa/MfaVerifyStep.tsx` (new)
- `src/translations/{en,ar,fa}.json` (keys: `mfa.codeInvalid`, `mfa.codeExpired`, `mfa.rateLimited`)

**Dependencies**

- Tasks 1–3

**Complexity**

Medium

### Task 5 — Verify `OtpInput` behavior in isolation

**Description**

Temporarily mount `OtpInput` on a scratch page and walk the Manual Testing Checklist (typing, arrows, Backspace, paste, auto-submit, error clear). Revert the scratch page afterwards.

**Files**

- Temporary scratch (reverted)

**Dependencies**

- Task 2

**Complexity**

Small

## Acceptance Criteria

✓ `pnpm lint` and `pnpm build` pass.

✓ `OtpInput` implements all of §12.2 (auto-advance, paste sanitize, auto-submit, error clear, disabled).

✓ `MfaVerifyStep` submits `{ code, context, mfa_token? }` correctly and maps 422/429 per §12.3.

✓ `Retry-After` disables the submit button for the returned seconds.

✓ All three locale files contain the new keys.

## Manual Testing Checklist

- [ ] Type 6 digits — focus auto-advances; submit fires automatically at 6.
- [ ] Backspace on an empty cell moves back; arrows/Home/End navigate.
- [ ] Paste `123-456`, ` 123456`, `12a34b56` — only the first 6 digits are accepted.
- [ ] Letters are rejected.
- [ ] On a 422 (wrong code, mocked or live): all cells clear, error text shows, retry works immediately.
- [ ] On a 429 with `Retry-After`: submit disabled for the duration, then re-enabled.
- [ ] Disabled state renders greyed inputs and blocks submission.
- [ ] Lint clean.
