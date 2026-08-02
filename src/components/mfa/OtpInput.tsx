import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";

import { useTranslations } from "@/hooks/useTranslations";
import { cn } from "@/lib/utils";

const CODE_LENGTH = 6;

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  onSubmitComplete?: () => void;
};

// Segmented 6-digit TOTP input (spec §12.2): auto-advance, arrow/Backspace
// navigation, sanitized paste, auto-submit at 6 digits, and clear-on-error.
export default function OtpInput({
  value,
  onChange,
  error,
  disabled,
  autoFocus,
  onSubmitComplete,
}: OtpInputProps) {
  const t = useTranslations();
  const cellRefs = useRef<Array<HTMLInputElement | null>>([]);
  const wasErrorRef = useRef(Boolean(error));

  const focusCell = (index: number) => {
    const clamped = Math.min(Math.max(index, 0), CODE_LENGTH - 1);
    const cell = cellRefs.current[clamped];

    if (cell) {
      cell.focus();
      cell.select();
    }
  };

  // Auto-focus the first cell on mount.
  useEffect(() => {
    if (autoFocus && !disabled) {
      focusCell(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On error (transition to true): clear all cells and refocus cell 0 (§12.2).
  useEffect(() => {
    if (error && !wasErrorRef.current) {
      onChange("");
      focusCell(0);
    }

    wasErrorRef.current = Boolean(error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const setDigit = (index: number, digit: string): string => {
    if (index < value.length) {
      return value.slice(0, index) + digit + value.slice(index + 1);
    }

    return (value + digit).slice(0, CODE_LENGTH);
  };

  const removeDigit = (index: number): string =>
    value.slice(0, index) + value.slice(index + 1);

  const handleChange = (index: number, raw: string) => {
    if (disabled) return;

    // Only a single digit is accepted; paste is sanitized at container level.
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;

    const next = setDigit(index, digit);
    onChange(next);

    if (index < CODE_LENGTH - 1) {
      focusCell(index + 1);
    }

    if (next.length === CODE_LENGTH && !disabled) {
      onSubmitComplete?.();
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (event.key === "Backspace") {
      event.preventDefault();

      if (value[index]) {
        onChange(removeDigit(index));
      } else if (index > 0) {
        focusCell(index - 1);
      }

      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();

      if (value[index]) {
        onChange(removeDigit(index));
      }

      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusCell(index - 1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusCell(index + 1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusCell(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      focusCell(CODE_LENGTH - 1);
      return;
    }

    // Reject letters and other non-digit printable keys.
    if (/^[a-zA-Z]$/.test(event.key)) {
      event.preventDefault();
    }
  };

  // Container-level paste: strip non-digits, take the first 6, distribute,
  // focus the last cell, and auto-submit when complete (§12.2).
  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    event.preventDefault();

    const digits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);

    if (!digits) return;

    onChange(digits);
    focusCell(digits.length - 1);

    if (digits.length === CODE_LENGTH) {
      onSubmitComplete?.();
    }
  };

  return (
    <div
      role="group"
      aria-label={t("mfa.codeLabel")}
      aria-disabled={disabled || undefined}
      className={cn("flex justify-center gap-2", disabled && "opacity-60")}
      onPaste={handlePaste}
    >
      {Array.from({ length: CODE_LENGTH }, (_, index) => (
        <input
          key={index}
          ref={(element) => {
            cellRefs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={value[index] ?? ""}
          disabled={disabled}
          aria-label={`${t("mfa.codeLabel")} ${index + 1}`}
          aria-invalid={error ? true : undefined}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          className={cn(
            "size-11 rounded-lg border bg-transparent text-center text-lg font-semibold text-foreground caret-primary outline-none transition-colors",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            error ? "border-destructive" : "border-input",
            "disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
          )}
        />
      ))}
    </div>
  );
}
