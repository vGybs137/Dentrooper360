import { clearDeviceId } from "@/helpers/auth/deviceId";
import { toDayKey, todayCalendarDate } from "@/helpers/schedule/calendar";
import {
  clearClinicRegistry,
  loadClinicRegistry,
} from "@/database/ClinicRegistry";
import { clinicDatabaseManager } from "@/database/ClinicDatabaseManager";
import { waitForAllClinicSyncsIdle } from "@/database/synchronize";
import { applyRtlForLocale } from "@/helpers/i18n/applyRtl";
import { changeAppLanguage } from "@/i18n";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { DEFAULT_PATIENT_COUNTRY_CODE } from "@/constants/patientForm";
import { DEFAULT_APP_LOCK_TIMEOUT_MS } from "@/security/biometric/shouldLockSession";
import { clearClinicRefreshToken } from "@/security/vault/clinicRefreshTokenVault";
import {
  applyThemeColorScheme,
  useAddAppointmentStore,
  useAddPatientStore,
  useAppLockStore,
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
 * Set true to wipe all local app data on the next cold start, then set false.
 * Used when the device is stuck unpaired and Settings is unreachable.
 */
export const FORCE_CLEAR_APPLICATION_DATA_ON_LAUNCH = false;

/**
 * Local wipe for development / support / recovery.
 * Drains in-flight syncs, deletes every known clinic DB + registry, clears
 * pairing secrets, auth / preference stores, and device id.
 * Caller should clear React Query and navigate to onboarding after this resolves.
 */
export async function clearApplicationData(): Promise<void> {
  await waitForAllClinicSyncsIdle();

  const registry = await loadClinicRegistry();
  const customerIds = new Set<string>();
  for (const id of Object.keys(registry.clinics)) {
    customerIds.add(id);
  }
  const activeCustomerId = useAuthStore.getState().customerId;
  if (activeCustomerId) {
    customerIds.add(activeCustomerId);
  }

  for (const customerId of customerIds) {
    await clearClinicRefreshToken(customerId);
  }

  // Stop ClinicSessionProvider from reopening SQLite while we unlink files.
  clinicDatabaseManager.beginExclusiveWipe();
  try {
    useAuthStore.getState().setCustomerId(null);
    await new Promise((resolve) => setTimeout(resolve, 50));

    await clinicDatabaseManager.resetAll();
    await clearClinicRegistry();

    const { clearAllSecurityState } = await import(
      "@/security/session/sessionVault"
    );
    await clearAllSecurityState();
    await useAuthStore.persist.clearStorage();
  } finally {
    clinicDatabaseManager.endExclusiveWipe();
  }

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

  useAppLockStore.setState({
    enabled: false,
    timeoutMs: DEFAULT_APP_LOCK_TIMEOUT_MS,
    biometricLoginEnabled: false,
    biometricLoginDeclined: false,
    isLocked: false,
    lastUnlockedAt: null,
    backgroundedAt: null,
    passwordFallback: false,
  });
  await useAppLockStore.persist.clearStorage();

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
