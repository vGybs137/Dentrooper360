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
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { clinicDatabaseManager } from "@/database/ClinicDatabaseManager";
import { clearScheduleAppointmentsPrefetch } from "@/helpers/schedule/prefetchScheduleAppointments";
import {
  hydrateActiveClinicSyncStatus,
  useCustomerId,
  useHasHydrated,
} from "@/stores";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";
import { ThemedText } from "@/components/ui";

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
 * Opens the active clinic SQLite via ClinicDatabaseManager and exposes it through
 * Watermelon's DatabaseProvider. Remounts the clinic subtree when customerId changes
 * so observers cannot leak across clinics.
 */
export function ClinicSessionProvider({ children }: ClinicSessionProviderProps) {
  const hasHydrated = useHasHydrated();
  const customerId = useCustomerId();
  const [database, setDatabase] = useState<Database | null>(null);
  const [readyCustomerId, setReadyCustomerId] = useState<string | null>(null);

  // Prefer React state when it already matches; otherwise adopt from the manager
  // during render so clinic switches do not render one frame without a provider.
  // Never serve a DB while the manager is pointed at a different clinic.
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
  const isClinicTransition =
    Boolean(customerId) &&
    ((readyCustomerId != null && readyCustomerId !== customerId) ||
      managerOutOfSync) &&
    !resolvedDatabase;

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

  if (!isDatabaseReady || !resolvedDatabase || !customerId) {
    return (
      <ClinicSessionContext.Provider value={value}>
        {isClinicTransition ? <ClinicSessionOpening /> : children}
      </ClinicSessionContext.Provider>
    );
  }

  return (
    <ClinicSessionContext.Provider value={value}>
      <DatabaseProvider database={resolvedDatabase}>
        {/* Remount all clinic-scoped UI when the active customer changes. */}
        <ClinicSessionSubtree key={customerId}>{children}</ClinicSessionSubtree>
      </DatabaseProvider>
    </ClinicSessionContext.Provider>
  );
}

function ClinicSessionSubtree({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function ClinicSessionOpening() {
  const native = useNativeColors();

  return (
    <View
      accessibilityLabel="Opening clinic"
      accessibilityViewIsModal
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: native.surface.default,
          alignItems: "center",
          justifyContent: "center",
          gap: semantic.space.gap.default,
          paddingHorizontal: semantic.space.inline.comfortable,
        },
      ]}
    >
      <ActivityIndicator color={native.brand.default} size="large" />
      <ThemedText align="center" className="font-semibold" variant="body">
        Opening clinic…
      </ThemedText>
    </View>
  );
}
