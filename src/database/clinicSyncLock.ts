/**
 * Tracks in-flight clinic syncs so setActive / switch cannot race a push/pull.
 * Kept separate from ClinicDatabaseManager and synchronize to avoid import cycles.
 */

const inFlightByCustomerId = new Map<string, Promise<void>>();

export function getClinicSyncInFlight(
  customerId: string,
): Promise<void> | undefined {
  return inFlightByCustomerId.get(customerId);
}

export function setClinicSyncInFlight(
  customerId: string,
  promise: Promise<void>,
): void {
  inFlightByCustomerId.set(customerId, promise);
}

export function clearClinicSyncInFlight(
  customerId: string,
  promise: Promise<void>,
): void {
  if (inFlightByCustomerId.get(customerId) === promise) {
    inFlightByCustomerId.delete(customerId);
  }
}

export function isClinicSyncInFlight(customerId: string): boolean {
  return inFlightByCustomerId.has(customerId);
}

export async function waitForClinicSyncIdle(
  customerId: string | null | undefined,
): Promise<void> {
  if (!customerId) {
    return;
  }

  const pending = inFlightByCustomerId.get(customerId);
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
