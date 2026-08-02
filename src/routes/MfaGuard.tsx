import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, useParams } from "react-router";

import { useProfile } from "@/hooks/useProfile";
import { useTranslations } from "@/hooks/useTranslations";
import { getMfaStatus } from "@/lib/profile";
import { useAuth } from "@/store/auth";

type Props = {
  children: ReactNode;
};

// Blocks the dashboard while the session's MFA setup is not active (UX: "the
// user can't access the dashboard if MFA is disabled"). The settings page is
// the gate: the login flow and this guard send MFA-less users there, and
// refusing the enable prompt ends the session.
export default function MfaGuard({ children }: Props) {
  const t = useTranslations();
  const { locale } = useParams<{ locale?: string }>();
  const { data: profile, isLoading, isError } = useProfile();
  const { mfaActive } = useAuth();

  const settingsPath = `/${locale ?? "en"}/dashboard/settings`;

  // MFA state: prefer the profile's fields when /me carries them, otherwise
  // fall back to the state captured at sign-in (the backend's /me exposes no
  // MFA fields, so the login response is the authoritative signal).
  const mfaState = getMfaStatus(profile) ?? mfaActive;

  // MFA confirmed inactive: redirect to the gate immediately — no point
  // waiting on /me (which may hang or be blocked for MFA-less sessions) — and
  // re-open the enable prompt there.
  if (mfaState === false) {
    return <Navigate to={settingsPath} replace state={{ mfaPrompt: true }} />;
  }

  if (isLoading) {
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-2 py-16"
      >
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {t("mfa.statusChecking")}
        </p>
      </div>
    );
  }

  // A failed /me fetch means the session cannot confirm a verified MFA setup
  // (or is broken): send the user to the settings gate instead of showing the
  // dashboard. No prompt state here — the error is not proof MFA is disabled.
  if (isError) {
    return <Navigate to={settingsPath} replace />;
  }

  return children;
}
