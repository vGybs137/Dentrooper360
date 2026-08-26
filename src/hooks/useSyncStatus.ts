import { useCallback, useEffect, useState } from "react";

import { SYNC_TABLE_NAMES } from "@/constants/sync";
import database from "@/database";
import { hasUnsyncedChanges } from "@/database/synchronize";
import {
  useIsOfflineMode,
  useLastSuccessfulSyncAt,
} from "@/stores";

const UNSYNCED_REFRESH_DEBOUNCE_MS = 300;

export function useSyncStatus() {
  const isOffline = useIsOfflineMode();
  const lastSuccessfulSyncAt = useLastSuccessfulSyncAt();
  const [hasUnsynced, setHasUnsynced] = useState(false);

  const refresh = useCallback(async () => {
    setHasUnsynced(await hasUnsyncedChanges());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, isOffline, lastSuccessfulSyncAt]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

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

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, [refresh]);

  return {
    isOffline,
    hasUnsynced,
    lastSuccessfulSyncAt,
    refresh,
  };
}
