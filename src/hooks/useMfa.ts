import { useMutation } from "@tanstack/react-query";

import { mfaVerifyRequest } from "@/lib/api";

// Shared verify mutation. The caller decides the context ("setup" | "login")
// and, for login, the mfa_token — both travel inside the request body.
export function useMfaVerify() {
  return useMutation({
    mutationFn: mfaVerifyRequest,
  });
}
