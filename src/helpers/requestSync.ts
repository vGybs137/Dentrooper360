import { SYNC_AFTER_WRITE_DEBOUNCE_MS } from "@/constants/sync";
import { synchronize } from "@/database/synchronize";
import { isDeviceOnline } from "@/helpers/connectivity";
import { useAuthStore, useSyncStatusStore } from "@/stores";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingCustomerId: string | null = null;

async function flushRequestSync(customerId: string): Promise<void> {
  if (useSyncStatusStore.getState().isOfflineMode) {
    return;
  }

  if (!(await isDeviceOnline())) {
    return;
  }

  try {
    await synchronize(customerId);
  } catch {
    // Periodic sync and reconnect will retry.
  }
}

/**
 * Schedules a background sync after local writes.
 * Debounced; no-op when offline or unpaired. Safe to fire-and-forget.
 */
export function requestSync(customerId?: string | null): void {
  const id = customerId ?? useAuthStore.getState().customerId;
  if (!id) {
    return;
  }

  pendingCustomerId = id;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    const target = pendingCustomerId;
    pendingCustomerId = null;
    if (!target) {
      return;
    }

    void flushRequestSync(target);
  }, SYNC_AFTER_WRITE_DEBOUNCE_MS);
}
