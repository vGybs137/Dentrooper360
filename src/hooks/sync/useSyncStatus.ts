import { useCallback, useEffect, useState } from "react";

import { SYNC_TABLE_NAMES } from "@/constants/sync";
import { clinicDatabaseManager } from "@/database/ClinicDatabaseManager";
import { hasUnsyncedChanges } from "@/database/synchronize";
import {
  useCustomerId,
  useIsOfflineMode,
  useLastSuccessfulSyncAt,
} from "@/stores";

const UNSYNCED_REFRESH_DEBOUNCE_MS = 300;

export function useSyncStatus() {
  const customerId = useCustomerId();
  const isOffline = useIsOfflineMode();
  const lastSuccessfulSyncAt = useLastSuccessfulSyncAt();
  const [hasUnsynced, setHasUnsynced] = useState(false);

  const refresh = useCallback(async () => {
    if (!customerId && !clinicDatabaseManager.tryGetActive()) {
      setHasUnsynced(false);
      return;
    }

    setHasUnsynced(await hasUnsyncedChanges(customerId));
  }, [customerId]);

  useEffect(() => {
    void refresh();
  }, [refresh, isOffline, lastSuccessfulSyncAt]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let unsubscribe: (() => void) | null = null;

    async function subscribe() {
      if (!customerId) {
        return;
      }

      try {
        const database = await clinicDatabaseManager.ensureActive(customerId);
        if (cancelled) {
          return;
        }

        const subscription = database
          .withChangesForTables([...SYNC_TABLE_NAMES])
          .subscribe(() => {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }

            timeoutId = setTimeout(() => {
              void refresh();
            }, UNSYNCED_REFRESH_DEBOUNCE_MS);
          });

        unsubscribe = () => subscription.unsubscribe();
      } catch {
        // Database not ready yet; refresh() already reported unsynced=false.
      }
    }

    void subscribe();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      unsubscribe?.();
    };
  }, [customerId, refresh]);

  return {
    isOffline,
    hasUnsynced,
    lastSuccessfulSyncAt,
    refresh,
  };
}
