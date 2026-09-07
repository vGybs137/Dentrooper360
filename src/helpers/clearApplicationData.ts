import database from "@/database";
import { clearDeviceId } from "@/helpers/deviceId";
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
import { toDayKey, todayCalendarDate } from "@/utils/calendar";

/**
 * Temporary local wipe for development / support.
 * Clears WatermelonDB, persisted stores, device id, and in-memory UI state.
 * Caller should clear React Query and navigate away after this resolves.
 */
export async function clearApplicationData(): Promise<void> {
  await database.write(async () => {
    await database.unsafeResetDatabase();
  });

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
