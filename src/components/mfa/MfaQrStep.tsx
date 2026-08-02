import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/hooks/useTranslations";
import type { MfaSetup } from "@/types/mfa";

type MfaQrStepProps = {
  setup: MfaSetup;
  onContinue: () => void;
};

const COPIED_RESET_MS = 2_000;

// Display the secret in readable 4-character groups (XXXX XXXX XXXX XXXX).
// Only the display is grouped — the raw value is what gets copied (§7.1).
function groupSecret(secret: string): string {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}

// QR + manual-entry secret step of the enable wizard (spec §8.1, §10.2).
export default function MfaQrStep({ setup, onContinue }: MfaQrStepProps) {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<number | null>(null);

  // Clear the transient "Copied" feedback timer on unmount.
  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  // Prefer the data URI; fall back to building one from the PNG base64 when
  // only that is present (§16 #15). Neither → secret-only step with a warning.
  const qrSrc =
    setup.qrcodeDataUri ||
    (setup.qrcodePngBase64
      ? `data:image/png;base64,${setup.qrcodePngBase64}`
      : undefined);

  const handleCopy = async () => {
    if (copied || !setup.secretBase32) return;

    try {
      await navigator.clipboard.writeText(setup.secretBase32);
      setCopied(true);
      copiedTimerRef.current = window.setTimeout(() => {
        setCopied(false);
      }, COPIED_RESET_MS);
    } catch {
      // Clipboard unavailable (permissions / insecure context): leave the
      // button idle — the secret stays selectable in the read-only input.
    }
  };

  return (
    <div className="space-y-4">
      {qrSrc ? (
        <div className="flex justify-center">
          <img
            src={qrSrc}
            alt={t("mfa.qrAlt")}
            className="size-[200px] rounded-lg object-contain"
          />
        </div>
      ) : (
        <Alert>
          <AlertDescription>{t("mfa.secretWarning")}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-2">
        <Input
          readOnly
          value={groupSecret(setup.secretBase32)}
          aria-label={t("mfa.secretLabel")}
          onFocus={(event) => event.currentTarget.select()}
          className="font-mono tracking-wider"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleCopy}
          disabled={!setup.secretBase32}
          className="shrink-0"
        >
          {copied ? <Check /> : <Copy />}
          {copied ? t("mfa.copied") : t("mfa.copySecret")}
        </Button>
      </div>

      {qrSrc && (
        <p className="text-sm text-muted-foreground">
          {t("mfa.secretWarning")}
        </p>
      )}

      <Button type="button" onClick={onContinue} className="h-11 w-full">
        {t("mfa.scannedQr")}
      </Button>
    </div>
  );
}
