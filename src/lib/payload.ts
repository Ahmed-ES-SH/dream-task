export type Payload = Record<string, unknown>;

export function unwrapPayload(raw: unknown): Payload {
  if (typeof raw !== "object" || raw === null) return {};

  const obj = raw as Payload;

  if (typeof obj.data === "object" && obj.data !== null) {
    return obj.data as Payload;
  }

  return obj;
}

export function pickString(
  obj: Payload,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = obj[key];

    if (typeof value === "string" && value.trim() !== "") return value;

    if (Array.isArray(value)) {
      const first = value.find(
        (item): item is string => typeof item === "string" && item.trim() !== "",
      );

      if (first) return first;
    }
  }

  return undefined;
}
