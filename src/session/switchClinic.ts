import type { QueryClient } from "@tanstack/react-query";

import { listClinics, switchClinicSession } from "@/api/functions/auth";
import { isClinicSwitchEnabled } from "@/constants/multiClinicFlags";
import { clinicDatabaseManager } from "@/database/ClinicDatabaseManager";
import {
  synchronize,
  waitForClinicSyncIdle,
} from "@/database/synchronize";
import { persistSession } from "@/helpers/auth/auth";
import { clearScheduleAppointmentsPrefetch } from "@/helpers/schedule/prefetchScheduleAppointments";
import {
  hydrateActiveClinicSyncStatus,
  useAddAppointmentStore,
  useAddPatientStore,
  useAuthStore,
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

  await persistSession(session, targetCustomerId);

  useAddAppointmentStore.getState().dismissImmediately();
  useAddPatientStore.setState({
    isPresented: false,
    step: "essentials",
    editingPatientId: null,
  });
  clearScheduleAppointmentsPrefetch();
  queryClient?.clear();

  await clinicDatabaseManager.setActive(targetCustomerId);
  await hydrateActiveClinicSyncStatus(targetCustomerId);

  if (wasCold || !skipSync) {
    await synchronize(targetCustomerId);
  }
}
