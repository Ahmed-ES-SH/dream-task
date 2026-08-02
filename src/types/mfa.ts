import { pickString, unwrapPayload, type Payload } from "@/lib/payload";

export type MfaSetup = {
  type: "totp";
  issuer: string;
  label: string;
  secretBase32: string;
  qrcodePngBase64?: string;
  qrcodeDataUri: string;
};

export type MfaSetupVerifyResponse = {
  enabled: boolean;
  verifiedAt?: string;
};

export type MfaLoginVerifyResponse = {
  refreshToken: string;
  accessToken?: string;
  expiresIn?: number;
  sessionJti?: string;
  sessionId?: number;
  email?: string;
  role?: string;
  mfa?: {
    verified: boolean;
    methods: string[];
    mfaVerifiedAt?: string;
  };
};

export type MfaVerifyBody = {
  code: string;
  context: "setup" | "login";
  mfa_token?: string;
};

function pickNumber(obj: Payload, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = obj[key];

    if (typeof value === "number" && Number.isFinite(value)) return value;
  }

  return undefined;
}

function pickBoolean(obj: Payload, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = obj[key];

    if (typeof value === "boolean") return value;
  }

  return undefined;
}

function pickStringArray(obj: Payload, keys: string[]): string[] | undefined {
  for (const key of keys) {
    const value = obj[key];

    if (Array.isArray(value)) {
      const items = value.filter(
        (item): item is string => typeof item === "string" && item.trim() !== "",
      );

      if (items.length > 0) return items;
    }
  }

  return undefined;
}

export function normalizeMfaSetup(raw: unknown): MfaSetup {
  const obj: Payload = unwrapPayload(raw);

  return {
    type: "totp",
    issuer: pickString(obj, ["issuer"]) ?? "",
    label: pickString(obj, ["label"]) ?? "",
    secretBase32:
      pickString(obj, ["secretBase32", "secret_base32"]) ?? "",
    qrcodePngBase64: pickString(obj, [
      "qrcodePngBase64",
      "qrcode_png_base64",
    ]),
    qrcodeDataUri:
      pickString(obj, ["qrcodeDataUri", "qrcode_data_uri"]) ?? "",
  };
}

export function normalizeSetupVerify(raw: unknown): MfaSetupVerifyResponse {
  const obj: Payload = unwrapPayload(raw);

  return {
    enabled: pickBoolean(obj, ["enabled"]) ?? false,
    verifiedAt: pickString(obj, ["verifiedAt", "verified_at"]),
  };
}

export function normalizeLoginVerify(raw: unknown): MfaLoginVerifyResponse {
  const obj: Payload = unwrapPayload(raw);

  const rawMfa = obj.mfa;
  const mfa =
    typeof rawMfa === "object" && rawMfa !== null
      ? {
          verified: pickBoolean(rawMfa as Payload, ["verified"]) ?? false,
          methods: pickStringArray(rawMfa as Payload, ["methods"]) ?? [],
          mfaVerifiedAt: pickString(rawMfa as Payload, [
            "mfaVerifiedAt",
            "mfa_verified_at",
          ]),
        }
      : undefined;

  return {
    refreshToken:
      pickString(obj, ["refreshToken", "refresh_token"]) ?? "",
    accessToken: pickString(obj, ["accessToken", "access_token"]),
    expiresIn: pickNumber(obj, ["expiresIn", "expires_in"]),
    sessionJti: pickString(obj, ["sessionJti", "session_jti"]),
    sessionId: pickNumber(obj, ["sessionId", "session_id"]),
    email: pickString(obj, ["email"]),
    role: pickString(obj, ["role"]),
    mfa,
  };
}
