# Phase 1 — UI Primitives (Toast + Dialog)

## Goal

Provide the two missing UI primitives the whole feature depends on: a toast system and a dialog primitive. The spec confirms neither exists today (`No dialog and no toast exist — both must be added`). After this phase, any component in later phases can mount a modal or show a toast.

Spec reference: §1 (grounding facts), §8 (component table), §14 (toast UX decisions).

## Depends On

- None. Builds directly on existing `ui/*` conventions (`@base-ui/react`, `cva`/`clsx`/`tailwind-merge`, `tw-animate-css`).

## Deliverables

- `sonner` dependency installed.
- `src/components/ui/toast.tsx` — `Toaster` mounted once in the app root.
- `src/components/ui/dialog.tsx` — base-ui `Dialog` wrapper (content, title, description, close button).
- Demo verification of both primitives (temporary code, reverted).

## Tasks

### Task 1 — Install `sonner`

**Description**

Add the `sonner` package (React 19 compatible toast library, matches the shadcn ecosystem). No other new dependencies.

**Files**

- `package.json` (lockfile changes)

**Dependencies**

- None

**Complexity**

Small

### Task 2 — Create the `Toaster` component

**Description**

Create `src/components/ui/toast.tsx` wrapping `sonner`'s `Toaster` with the project's styling conventions (position consistent with the design, `theme` from the app). Export the `Toaster` component and mount it once in the app root (next to the existing providers, e.g. `src/main.tsx`). Also export a small `toast` re-export or typed helper so later phases call `toast.success(...)` / `toast.error(...)`.

**Files**

- `src/components/ui/toast.tsx` (new)
- `src/main.tsx` (mount `<Toaster/>`)

**Dependencies**

- Task 1

**Complexity**

Small

### Task 3 — Create the `Dialog` component

**Description**

Create `src/components/ui/dialog.tsx` following the existing shadcn-style wrapper pattern used by `ui/button.tsx`, `ui/alert.tsx`, etc. Wrap base-ui's `Dialog` (or `Dialog.Root` / `Dialog.Portal` / `Dialog.Popup` primitives) with: `open` / `onOpenChange` props, styled backdrop, content surface, `DialogTitle` + `DialogDescription` exports, and a close (X) button. Focus trap and Esc handling come from base-ui — do not reimplement.

**Files**

- `src/components/ui/dialog.tsx` (new)

**Dependencies**

- None (uses `@base-ui/react` already in `package.json`)

**Complexity**

Medium

### Task 4 — Verify both primitives with temporary demo usage

**Description**

Temporarily mount a `Dialog` with a trigger button and fire `toast.success(...)` / `toast.error(...)` from an existing page (e.g. `src/pages/Dashboard.tsx`). Verify behavior per the Manual Testing Checklist, then **revert the demo code**. The only persistent artifacts are `ui/toast.tsx`, `ui/dialog.tsx`, and the `<Toaster/>` mount.

**Files**

- `src/pages/Dashboard.tsx` (temporary, reverted)

**Dependencies**

- Tasks 2, 3

**Complexity**

Small

## Acceptance Criteria

✓ `pnpm lint` and `pnpm build` pass.

✓ `Toaster` is mounted and renders toasts at the expected position.

✓ `Dialog` opens/closes via controlled `open` prop; Esc and backdrop close work; focus is trapped inside; focus returns to the trigger on close.

✓ No demo code remains (only the two primitives + mount point).

## Manual Testing Checklist

- [ ] Trigger a success toast and an error toast — both render with correct styling and auto-dismiss.
- [ ] Multiple toasts stack correctly.
- [ ] Open a dialog with a button; Tab cycles inside the dialog only; Esc closes; backdrop click closes; X button closes.
- [ ] After close, focus returns to the trigger button.
- [ ] Dialog content scrolls if it overflows the viewport.
- [ ] Keyboard-only pass: the dialog is fully operable without a mouse.
