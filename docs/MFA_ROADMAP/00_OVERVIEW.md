# MFA Implementation Roadmap — Execution Overview

Execution companion to [`docs/MFA_FRONTEND_PLAN.md`](../MFA_FRONTEND_PLAN.md) (the spec). This roadmap does **not** redesign the solution — it reorganizes the spec into 12 sequential implementation phases. Each phase is a stable, testable milestone and each task inside a phase is sized for its own Git commit.

## How to use

1. Work phases in order. A phase starts only when the previous phase's **Acceptance Criteria** pass.
2. Complete the **Manual Testing Checklist** before declaring a phase done.
3. Commit per task (each task is independently implementable); one phase per branch if you prefer reviewable PRs.
4. Keep the spec at hand: every task references the relevant spec section (`§N`) for full detail.

## Phase map

| Phase | Title | Milestone | Depends on |
|---|---|---|---|
| 1 | UI Primitives (Toast + Dialog) | Reusable `Dialog` and `Toaster` exist and are verified | — |
| 2 | MFA Types & Normalizers | Full MFA type layer + MFA-aware login normalizer | — |
| 3 | MFA API Requests | Constants, wrappers, error-code helper, 401 skip-list | 2 |
| 4 | Auth Store & Login Form Restructure | `login()` returns `LoginResult`; login page has 2 steps | 2 |
| 5 | OTP Input & Shared Verify Step | `OtpInput` + `mfa/MfaVerifyStep` (OTP UX complete) | 3 |
| 6 | Login Challenge Step | **Scenario B works end-to-end** (login → code → dashboard) | 4, 5 |
| 7 | Settings Page & Route | Protected `/dashboard/settings` reachable from UserMenu | — |
| 8 | Security Card & Status | Card shows status + action buttons, status from profile | 2, 7 |
| 9 | Enable Flow — Setup & QR | Modal opens, loads QR + secret, error/retry/cancel | 1, 3, 8 |
| 10 | Enable Flow — Verify & Success | **Enable MFA works end-to-end** (QR → code → enabled) | 5, 9 |
| 11 | Disable Flow | **Disable MFA works end-to-end** (password + code → disabled) | 1, 3, 5, 8 |
| 12 | QA & Hardening | Lint/build green, i18n parity, edge cases, a11y, DoD | all |

## Dependency graph

```
Phase 1 ─────────────────────────────────────────────┐
Phase 2 ──► Phase 3 ──► Phase 5 ──► Phase 6          │
Phase 2 ──► Phase 4 ─────────────┘                   │
Phase 2 ──► Phase 8 ──► Phase 9 ──► Phase 10         │
Phase 7 ────────────┘                                │
Phase 5 ────────────► Phase 11 ◄─────────────────────┤
Phase 3 ────► Phase 11                              │
Phase 1 ────► Phase 9, Phase 11 ◄───────────────────┘
Phase 12 ◄── all phases
```

## Backend confirmation gates (from the spec's open questions)

The roadmap is written defensively so no phase is hard-blocked, but these should be confirmed before the phase that depends on them:

| Question | Blocks | Defensive default in roadmap |
|---|---|---|
| Q1: How does `POST /v1/auth/login` signal MFA-required (flag vs. token presence)? | Phase 4 | Derive `mfaRequired` from `mfa_token` presence OR truthy `mfa_required` (spec §11.3) |
| Q2: Does login-verify ever return an `access_token`? | Phase 6 | Mint one via the existing refresh path when absent (§11.5) |
| Q3: Does `GET /v1/core/users/me` carry MFA fields? | Phase 8 | Card shows `unknown` when absent; flips on local mutation success (§6.2) |
| Q4: Does `mfa/setup` return a fresh secret each call? | Phase 9 | Always re-call setup on modal open; treat 409 as "already enabled" (§13) |

## Timeline (indicative, sequential)

| Phase | Effort (dev-days) |
|---|---|
| 1 | 0.5–1 |
| 2 | 0.5 |
| 3 | 0.5–1 |
| 4 | 1 |
| 5 | 1–1.5 |
| 6 | 1–1.5 |
| 7 | 0.5 |
| 8 | 0.5–1 |
| 9 | 1–1.5 |
| 10 | 1 |
| 11 | 1–1.5 |
| 12 | 1 |
| **Total** | **≈ 10–13 dev-days** |

## Definition of Done

Phase 12 closes against the 21-item checklist in spec §21. Nothing ships before all phases are green.
