import { z } from "zod";

import type { useTranslations } from "@/hooks/useTranslations";

export type Translator = ReturnType<typeof useTranslations>;

export function createLoginSchema(t: Translator) {
  return z.object({
    email: z
      .string()
      .min(1, t("login.emailRequired"))
      .email(t("login.emailInvalid")),
    password: z
      .string()
      .min(1, t("login.passwordRequired"))
      .min(6, t("login.passwordMin"))
      .max(72),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;
