import { z } from "zod";

import type { Translator } from "@/types/profile";

// A TOTP code is always exactly 6 digits (spec §12.1).
export const otpSchema = (t: Translator) =>
  z.string().regex(/^\d{6}$/, t("mfa.codeInvalid"));

// Disable confirmation: the current password + a valid TOTP code (spec §12.1).
// The password rule reuses the login namespace's key rather than duplicating
// it under `mfa`.
export function createDisableMfaSchema(t: Translator) {
  return z.object({
    password: z.string().min(1, t("login.passwordRequired")),
    code: otpSchema(t),
  });
}

export type DisableMfaFormValues = z.infer<
  ReturnType<typeof createDisableMfaSchema>
>;
