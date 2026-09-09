import { clearDeviceId } from "@/helpers/auth/deviceId";
import { toDayKey, todayCalendarDate } from "@/helpers/schedule/calendar";
import { clinicDatabaseManager } from "@/database/ClinicDatabaseManager";
import {
  applyThemeColorScheme,
  useAddAppointmentStore,
  useAddPatientStore,
  useAuthStore,
  useCalendarSelectionStore,
  useSchedulePreferencesStore,
  useScheduleViewModeStore,
  useSyncStatusStore,
  useThemePreferencesStore,
} from "@/stores";

/**
 * Temporary local wipe for development / support.
 * Resets every known clinic WatermelonDB, registry, persisted stores, device id,
 * and in-memory UI state.
 * Caller should clear React Query and navigate away after this resolves.
 */
export async function clearApplicationData(): Promise<void> {
  await clinicDatabaseManager.resetAll();

  useAuthStore.getState().clearAll();
  await useAuthStore.persist.clearStorage();

  useSyncStatusStore.setState({
    lastSuccessfulSyncAt: null,
    syncWifiOnly: false,
    isOfflineMode: false,
  });
  await useSyncStatusStore.persist.clearStorage();

  useSchedulePreferencesStore.setState({
    defaultCalendarView: "last",
    hourFormat: "12h",
    weekStartsOn: 1,
    lastViewMode: "month",
    defaultLocationId: null,
  });
  await useSchedulePreferencesStore.persist.clearStorage();

  useThemePreferencesStore.setState({
    mode: "system",
    appliedMode: "system",
    isSwitching: false,
  });
  applyThemeColorScheme("system");
  await useThemePreferencesStore.persist.clearStorage();

  useAddAppointmentStore.getState().dismissImmediately();
  useAddPatientStore.setState({
    isPresented: false,
    step: "essentials",
    editingPatientId: null,
  });
  useCalendarSelectionStore.setState({
    selectedDayKey: toDayKey(todayCalendarDate()),
  });
  useScheduleViewModeStore.setState({ viewMode: "month" });

  await clearDeviceId();
}
