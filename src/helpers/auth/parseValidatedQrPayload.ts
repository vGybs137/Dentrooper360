const GUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export type ValidatedQrPayload = {
  customerId: string;
  productId: string;
};

export function parseValidatedQrPayload(data: string): ValidatedQrPayload | null {
  if (!data) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const record = parsed as Record<string, unknown>;
  const registrationKey = record.registration_key;
  if (typeof registrationKey !== "string") {
    return null;
  }

  const [customerId, productId] = registrationKey.split("|");
  if (!customerId || !productId) {
    return null;
  }

  if (!GUID_RE.test(customerId) || !GUID_RE.test(productId)) {
    return null;
  }

  return { customerId, productId };
}
