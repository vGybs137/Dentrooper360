import * as Crypto from "expo-crypto";
import { v7 as uuidv7 } from "uuid";

/** RFC 9562 UUID v7 using expo-crypto for cryptographically secure random bytes. */
export function generateGuid(): string {
  return uuidv7({
    rng: () => Crypto.getRandomValues(new Uint8Array(16)),
  });
}
