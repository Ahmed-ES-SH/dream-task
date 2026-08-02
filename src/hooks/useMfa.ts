import { useMutation } from "@tanstack/react-query";

import { mfaSetupRequest, mfaVerifyRequest } from "@/lib/api";

// Setup mutation for the enable wizard (spec §9.1): `mutationFn` only — the
// modal owns the returned data. Re-invoked on every open (Q4 default: the
// backend returns a fresh secret per call), so nothing is cached here.
export function useMfaSetup() {
  return useMutation({
    mutationFn: mfaSetupRequest,
  });
}

// Shared verify mutation. The caller decides the context ("setup" | "login")
// and, for login, the mfa_token — both travel inside the request body.
export function useMfaVerify() {
  return useMutation({
    mutationFn: mfaVerifyRequest,
  });
}
