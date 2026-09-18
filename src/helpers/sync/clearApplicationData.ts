import { clearDeviceId } from "@/helpers/auth/deviceId";
import { toDayKey, todayCalendarDate } from "@/helpers/schedule/calendar";
import { clinicDatabaseManager } from "@/database/ClinicDatabaseManager";
import { waitForAllClinicSyncsIdle } from "@/database/synchronize";
import { applyRtlForLocale } from "@/helpers/i18n/applyRtl";
import { changeAppLanguage } from "@/i18n";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { DEFAULT_PATIENT_COUNTRY_CODE } from "@/constants/patientForm";
import {
  applyThemeColorScheme,
  useAddAppointmentStore,
  useAddPatientStore,
  useAuthStore,
  useCalendarSelectionStore,
  useLocalePreferencesStore,
  usePatientPreferencesStore,
  usePrivacyPreferencesStore,
  useSchedulePreferencesStore,
  useScheduleViewModeStore,
  useSyncStatusStore,
  useThemePreferencesStore,
} from "@/stores";

/**
 * Temporary local wipe for development / support.
 * Drains in-flight syncs, resets every known clinic WatermelonDB + registry,
 * then clears auth / preference stores and device id.
 * Caller should clear React Query and navigate away after this resolves.
 */
export async function clearApplicationData(): Promise<void> {
  await waitForAllClinicSyncsIdle();
  await clinicDatabaseManager.resetAll();

  const { clearAllSecurityState } = await import("@/security/session/sessionVault");
  await clearAllSecurityState();
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
    defaultAppointmentDurationMinutes: 60,
  });
  await useSchedulePreferencesStore.persist.clearStorage();

  usePatientPreferencesStore.setState({
    defaultCountryCode: DEFAULT_PATIENT_COUNTRY_CODE,
  });
  await usePatientPreferencesStore.persist.clearStorage();

  usePrivacyPreferencesStore.setState({
    hideInAppSwitcher: true,
  });
  await usePrivacyPreferencesStore.persist.clearStorage();

  useThemePreferencesStore.setState({
    mode: "system",
    appliedMode: "system",
    isSwitching: false,
  });
  applyThemeColorScheme("system");
  await useThemePreferencesStore.persist.clearStorage();

  useLocalePreferencesStore.setState({
    mode: "system",
    resolvedLocale: DEFAULT_LOCALE,
  });
  await changeAppLanguage(DEFAULT_LOCALE);
  applyRtlForLocale(DEFAULT_LOCALE);
  await useLocalePreferencesStore.persist.clearStorage();

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
