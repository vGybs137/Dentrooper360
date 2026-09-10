/** Best-effort decode of JWT payload `customer_id` (signature already trusted by HTTP layer). */
export function readAccessTokenCustomerId(
  accessToken: string | null | undefined,
): string | null {
  if (!accessToken) {
    return null;
  }

  try {
    const payloadSegment = accessToken.split(".")[1];
    if (!payloadSegment) {
      return null;
    }

    const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );

    let json: string;
    if (typeof atob === "function") {
      json = atob(padded);
    } else {
      const nodeBuffer = (
        globalThis as {
          Buffer?: {
            from: (data: string, encoding: string) => { toString: (enc: string) => string };
          };
        }
      ).Buffer;
      if (!nodeBuffer) {
        return null;
      }
      json = nodeBuffer.from(padded, "base64").toString("utf8");
    }

    const payload = JSON.parse(json) as { customer_id?: string };
    return typeof payload.customer_id === "string" ? payload.customer_id : null;
  } catch {
    return null;
  }
}
