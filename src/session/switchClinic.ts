import type { QueryClient } from "@tanstack/react-query";

import { listClinics, switchClinicSession } from "@/api/functions/auth";
import { isClinicSwitchEnabled } from "@/constants/multiClinicFlags";
import { clinicDatabaseManager } from "@/database/ClinicDatabaseManager";
import {
  synchronize,
  waitForClinicSyncIdle,
} from "@/database/synchronize";
import { persistSession } from "@/helpers/auth/auth";
import { toDayKey, todayCalendarDate } from "@/helpers/schedule/calendar";
import { clearScheduleAppointmentsPrefetch } from "@/helpers/schedule/prefetchScheduleAppointments";
import { stopConnectivitySync } from "@/services/connectivitySync";
import { stopPeriodicSync } from "@/services/periodicSync";
import {
  hydrateActiveClinicSyncStatus,
  useAddAppointmentStore,
  useAddPatientStore,
  useAuthStore,
  useCalendarSelectionStore,
  useClinicSwitchStore,
} from "@/stores";

export class ClinicSwitchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClinicSwitchError";
  }
}

export type SwitchClinicOptions = {
  targetCustomerId: string;
  queryClient?: QueryClient;
  /** Skip post-switch sync (e.g. offline warm clinic). */
  skipSync?: boolean;
};

/**
 * Ordered clinic switch protocol.
 * Drain → token switch → tear down UI caches → open target DB → sync
 * (required when the target was demoted / cold).
 */
export async function switchClinic({
  targetCustomerId,
  queryClient,
  skipSync = false,
}: SwitchClinicOptions): Promise<void> {
  const store = useAuthStore.getState();
  const activeCustomerId = store.customerId;
  const refreshToken = store.refreshToken;
  const switchUi = useClinicSwitchStore.getState();

  if (!activeCustomerId) {
    throw new ClinicSwitchError("No active clinic is paired on this device.");
  }

  if (!isClinicSwitchEnabled()) {
    throw new ClinicSwitchError(
      "Clinic switching is disabled on this build.",
    );
  }

  if (activeCustomerId === targetCustomerId) {
    await clinicDatabaseManager.ensureActive(targetCustomerId);
    return;
  }

  switchUi.beginSwitch();
  // Pause background sync so it cannot flip the active DB mid-switch.
  stopPeriodicSync();
  stopConnectivitySync();

  try {
    const memberships = await listClinics();
    const allowed = memberships.clinics.some(
      (clinic) => clinic.customerId === targetCustomerId && clinic.isActive,
    );
    if (!allowed) {
      throw new ClinicSwitchError("You are not a member of the requested clinic.");
    }

    await waitForClinicSyncIdle(activeCustomerId);

    const unsynced = await clinicDatabaseManager.hasUnsyncedChanges(activeCustomerId);
    if (unsynced) {
      try {
        await synchronize(activeCustomerId);
      } catch {
        throw new ClinicSwitchError(
          "Sync the current clinic before switching. Local changes could not be uploaded.",
        );
      }

      const stillUnsynced =
        await clinicDatabaseManager.hasUnsyncedChanges(activeCustomerId);
      if (stillUnsynced) {
        throw new ClinicSwitchError(
          "Sync the current clinic before switching. Local changes are still pending.",
        );
      }
    }

    await waitForClinicSyncIdle(activeCustomerId);

    const wasCold =
      await clinicDatabaseManager.wasColdBeforeOpen(targetCustomerId);

    if (wasCold && skipSync) {
      throw new ClinicSwitchError(
        "This clinic’s local data was cleared to free space. Connect online to download it again.",
      );
    }

    const session = await switchClinicSession({
      customerId: targetCustomerId,
      refreshToken,
    });

    useAddAppointmentStore.getState().dismissImmediately();
    useAddPatientStore.setState({
      isPresented: false,
      step: "essentials",
      editingPatientId: null,
    });
    useCalendarSelectionStore
      .getState()
      .setSelectedDayKey(toDayKey(todayCalendarDate()));
    clearScheduleAppointmentsPrefetch();
    queryClient?.clear();

    // Persist auth first so ClinicSessionProvider drops the previous clinic DB
    // (shows Opening) before the manager moves. Avoids serving clinic A UI while
    // the active SQLite file is already clinic B.
    await persistSession(session, targetCustomerId);

    await clinicDatabaseManager.setActive(targetCustomerId);
    await hydrateActiveClinicSyncStatus(targetCustomerId);

    if (wasCold || !skipSync) {
      await synchronize(targetCustomerId);
    }

    switchUi.endSwitch();
  } catch (error) {
    const fallbackCustomerId = useAuthStore.getState().customerId;
    if (fallbackCustomerId) {
      try {
        await clinicDatabaseManager.ensureActive(fallbackCustomerId);
        await hydrateActiveClinicSyncStatus(fallbackCustomerId);
      } catch {
        // Best-effort restore; surface the original switch error.
      }
    }

    const message =
      error instanceof ClinicSwitchError
        ? error.message
        : error instanceof Error && error.message.trim()
          ? error.message
          : "Unable to switch clinics. Please try again.";
    switchUi.failSwitch(message);
    throw error;
  }
}
