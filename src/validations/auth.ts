import { z } from "zod";

// Messages are translation keys (not translated text): they are resolved at
// render time via `t(...)`, so field errors stay in sync when the user
// switches language while an error is visible.
export function createLoginSchema() {
  return z.object({
    email: z
      .string()
      .min(1, "login.emailRequired")
      .email("login.emailInvalid"),
    password: z
      .string()
      .min(1, "login.passwordRequired")
      .min(6, "login.passwordMin")
      .max(72),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;
