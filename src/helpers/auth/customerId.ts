/** Clinic ids are GUIDs. Servers emit lowercase; QR payloads often do not. */
export function canonicalCustomerId(
  customerId: string | null | undefined,
): string | null {
  const trimmed = customerId?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.toLowerCase();
}

export function sameCustomerId(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const a = canonicalCustomerId(left);
  const b = canonicalCustomerId(right);
  return a !== null && a === b;
}
