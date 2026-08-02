import { z } from "zod";

import type { Translator } from "@/validations/auth";

// A TOTP code is always exactly 6 digits (spec §12.1).
export const otpSchema = (t: Translator) =>
  z.string().regex(/^\d{6}$/, t("mfa.codeInvalid"));
