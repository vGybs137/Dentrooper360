import { canonicalCustomerId } from "@/helpers/auth/customerId";

/**
 * Tracks in-flight clinic syncs so setActive / switch cannot race a push/pull.
 * Kept separate from ClinicDatabaseManager and synchronize to avoid import cycles.
 */

const inFlightByCustomerId = new Map<string, Promise<void>>();

function lockKey(customerId: string | null | undefined): string | null {
  return canonicalCustomerId(customerId);
}

export function getClinicSyncInFlight(
  customerId: string,
): Promise<void> | undefined {
  const key = lockKey(customerId);
  if (!key) {
    return undefined;
  }

  return inFlightByCustomerId.get(key);
}

export function setClinicSyncInFlight(
  customerId: string,
  promise: Promise<void>,
): void {
  const key = lockKey(customerId);
  if (!key) {
    return;
  }

  inFlightByCustomerId.set(key, promise);
}

export function clearClinicSyncInFlight(
  customerId: string,
  promise: Promise<void>,
): void {
  const key = lockKey(customerId);
  if (!key) {
    return;
  }

  if (inFlightByCustomerId.get(key) === promise) {
    inFlightByCustomerId.delete(key);
  }
}

export function isClinicSyncInFlight(customerId: string): boolean {
  const key = lockKey(customerId);
  return key !== null && inFlightByCustomerId.has(key);
}

export async function waitForClinicSyncIdle(
  customerId: string | null | undefined,
): Promise<void> {
  if (!customerId) {
    return;
  }

  const key = lockKey(customerId);
  if (!key) {
    return;
  }

  const pending = inFlightByCustomerId.get(key);
  if (!pending) {
    return;
  }

  try {
    await pending;
  } catch {
    // Swallow — callers only care that the lock released.
  }
}

export async function waitForAllClinicSyncsIdle(): Promise<void> {
  const pending = [...inFlightByCustomerId.values()];
  if (pending.length === 0) {
    return;
  }

  await Promise.all(
    pending.map(async (promise) => {
      try {
        await promise;
      } catch {
        // ignore
      }
    }),
  );
}
