import { DatabaseProvider } from "@nozbe/watermelondb/react";
import type { Database } from "@nozbe/watermelondb";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { clinicDatabaseManager } from "@/database/ClinicDatabaseManager";
import { clearScheduleAppointmentsPrefetch } from "@/helpers/schedule/prefetchScheduleAppointments";
import { useCustomerId, useHasHydrated } from "@/stores";

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

/**
 * Opens the active clinic SQLite via ClinicDatabaseManager and exposes it through
 * Watermelon's DatabaseProvider. Remounts the clinic subtree when customerId changes
 * so observers cannot leak across clinics.
 */
export function ClinicSessionProvider({ children }: ClinicSessionProviderProps) {
  const hasHydrated = useHasHydrated();
  const customerId = useCustomerId();
  const [database, setDatabase] = useState<Database | null>(null);
  const [readyCustomerId, setReadyCustomerId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function openClinicDatabase() {
      if (!hasHydrated || !customerId) {
        if (!cancelled) {
          setDatabase(null);
          setReadyCustomerId(null);
        }
        clearScheduleAppointmentsPrefetch();
        return;
      }

      try {
        clearScheduleAppointmentsPrefetch();
        const nextDatabase = await clinicDatabaseManager.ensureActive(customerId);
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

  const isDatabaseReady =
    Boolean(customerId) &&
    Boolean(database) &&
    readyCustomerId === customerId;

  const value = useMemo<ClinicSessionValue>(
    () => ({
      customerId,
      database: isDatabaseReady ? database : null,
      isDatabaseReady,
    }),
    [customerId, database, isDatabaseReady],
  );

  if (!isDatabaseReady || !database || !customerId) {
    return (
      <ClinicSessionContext.Provider value={value}>
        {children}
      </ClinicSessionContext.Provider>
    );
  }

  return (
    <ClinicSessionContext.Provider value={value}>
      <DatabaseProvider database={database}>
        {/* Remount all clinic-scoped UI when the active customer changes. */}
        <ClinicSessionSubtree key={customerId}>{children}</ClinicSessionSubtree>
      </DatabaseProvider>
    </ClinicSessionContext.Provider>
  );
}

function ClinicSessionSubtree({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
