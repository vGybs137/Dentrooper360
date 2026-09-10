import { DatabaseProvider } from "@nozbe/watermelondb/react";
import type { Database } from "@nozbe/watermelondb";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { clinicDatabaseManager } from "@/database/ClinicDatabaseManager";
import { clearScheduleAppointmentsPrefetch } from "@/helpers/schedule/prefetchScheduleAppointments";
import {
  hydrateActiveClinicSyncStatus,
  useCustomerId,
  useHasHydrated,
} from "@/stores";

type ClinicSessionValue = {
  customerId: string | null;
  database: Database | null;
  isDatabaseReady: boolean;
};

const ClinicSessionContext = createContext<ClinicSessionValue>({
  customerId: null,
  database: null,
  isDatabaseReady: false,
});

export function useClinicSession(): ClinicSessionValue {
  return useContext(ClinicSessionContext);
}

type ClinicSessionProviderProps = {
  children: ReactNode;
};

function resolveManagerDatabase(customerId: string | null): Database | null {
  if (!customerId) {
    return null;
  }
  if (clinicDatabaseManager.getActiveCustomerId() !== customerId) {
    return null;
  }
  return clinicDatabaseManager.tryGetActive();
}

/**
 * Opens the active clinic SQLite and publishes it on context.
 * Does not wrap children in DatabaseProvider — that belongs in
 * {@link ClinicDatabaseBoundary} on clinic routes only, so auth pairing/login
 * are not remounted when customerId or auth state changes.
 */
export function ClinicSessionProvider({ children }: ClinicSessionProviderProps) {
  const hasHydrated = useHasHydrated();
  const customerId = useCustomerId();
  const [database, setDatabase] = useState<Database | null>(null);
  const [readyCustomerId, setReadyCustomerId] = useState<string | null>(null);

  const managerActiveId = hasHydrated
    ? clinicDatabaseManager.getActiveCustomerId()
    : null;
  const managerOutOfSync =
    Boolean(customerId) &&
    managerActiveId != null &&
    managerActiveId !== customerId;

  const stateDatabase =
    !managerOutOfSync &&
    customerId &&
    readyCustomerId === customerId
      ? database
      : null;
  const managerDatabase =
    hasHydrated && !managerOutOfSync
      ? resolveManagerDatabase(customerId)
      : null;
  const resolvedDatabase = stateDatabase ?? managerDatabase;
  const isDatabaseReady = Boolean(customerId && resolvedDatabase);

  useLayoutEffect(() => {
    if (!customerId || !resolvedDatabase) {
      return;
    }
    if (readyCustomerId !== customerId || database !== resolvedDatabase) {
      setDatabase(resolvedDatabase);
      setReadyCustomerId(customerId);
    }
  }, [customerId, database, readyCustomerId, resolvedDatabase]);

  useEffect(() => {
    let cancelled = false;

    async function openClinicDatabase() {
      if (!hasHydrated || !customerId) {
        if (!cancelled) {
          setDatabase(null);
          setReadyCustomerId(null);
        }
        clearScheduleAppointmentsPrefetch();
        void hydrateActiveClinicSyncStatus(null);
        return;
      }

      if (resolveManagerDatabase(customerId)) {
        return;
      }

      try {
        clearScheduleAppointmentsPrefetch();
        const nextDatabase =
          await clinicDatabaseManager.ensureActive(customerId);
        await hydrateActiveClinicSyncStatus(customerId);
        if (!cancelled) {
          setDatabase(nextDatabase);
          setReadyCustomerId(customerId);
        }
      } catch (error) {
        console.error("[ClinicSession] Failed to open clinic database", error);
        if (!cancelled) {
          setDatabase(null);
          setReadyCustomerId(null);
        }
      }
    }

    void openClinicDatabase();

    return () => {
      cancelled = true;
    };
  }, [customerId, hasHydrated]);

  const value = useMemo<ClinicSessionValue>(
    () => ({
      customerId,
      database: isDatabaseReady ? resolvedDatabase : null,
      isDatabaseReady,
    }),
    [customerId, isDatabaseReady, resolvedDatabase],
  );

  return (
    <ClinicSessionContext.Provider value={value}>
      {children}
    </ClinicSessionContext.Provider>
  );
}
