import type { QueryClient } from "@tanstack/react-query";

import { listClinics, switchClinicSession } from "@/api/functions/auth";
import { httpClient } from "@/api/httpClient";
import { AUTH_REFRESH_PATH } from "@/constants/auth";
import { isClinicSwitchEnabled } from "@/constants/multiClinicFlags";
import { clinicDatabaseManager } from "@/database/ClinicDatabaseManager";
import {
  synchronize,
  waitForClinicSyncIdle,
} from "@/database/synchronize";
import {
  mapAuthSession,
  persistSession,
  type WireAuthSession,
} from "@/helpers/auth/auth";
import { canonicalCustomerId, sameCustomerId } from "@/helpers/auth/customerId";
import { getOrCreateDeviceId } from "@/helpers/auth/deviceId";
import { toDayKey, todayCalendarDate } from "@/helpers/schedule/calendar";
import { clearScheduleAppointmentsPrefetch } from "@/helpers/schedule/prefetchScheduleAppointments";
import { t } from "@/i18n";
import {
  persistClinicRefreshToken,
  readClinicRefreshToken,
} from "@/security/vault/clinicRefreshTokenVault";
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
import type { AuthSession } from "@/types/auth";

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

async function drainActiveClinic(activeCustomerId: string): Promise<void> {
  await waitForClinicSyncIdle(activeCustomerId);

  const unsynced =
    await clinicDatabaseManager.hasUnsyncedChanges(activeCustomerId);
  if (unsynced) {
    try {
      await synchronize(activeCustomerId);
    } catch {
      throw new ClinicSwitchError(t("settings:clinics.error.syncBeforeSwitch"));
    }

    const stillUnsynced =
      await clinicDatabaseManager.hasUnsyncedChanges(activeCustomerId);
    if (stillUnsynced) {
      throw new ClinicSwitchError(t("settings:clinics.error.stillPending"));
    }
  }

  await waitForClinicSyncIdle(activeCustomerId);
}

function tearDownClinicUi(queryClient?: QueryClient): void {
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
}

async function finishClinicHandoff(
  targetId: string,
  session: AuthSession,
  queryClient: QueryClient | undefined,
  skipSync: boolean,
): Promise<{ shouldSync: boolean }> {
  const wasCold = await clinicDatabaseManager.wasColdBeforeOpen(targetId);
  if (wasCold && skipSync) {
    throw new ClinicSwitchError(t("settings:clinics.error.coldNeedsOnline"));
  }

  tearDownClinicUi(queryClient);
  await persistSession(session, targetId);
  await clinicDatabaseManager.setActive(targetId);
  await hydrateActiveClinicSyncStatus(targetId);

  return { shouldSync: wasCold || !skipSync };
}

/**
 * Restore a previously signed-in clinic using its stored refresh token
 * (separate account on this device).
 */
async function restoreClinicFromStoredRefresh(
  targetId: string,
  activeCustomerId: string,
  activeRefresh: string | null,
  queryClient: QueryClient | undefined,
  skipSync: boolean,
): Promise<{ restored: boolean; shouldSync: boolean }> {
  const targetRefresh = await readClinicRefreshToken(targetId);
  if (!targetRefresh) {
    return { restored: false, shouldSync: false };
  }

  if (activeCustomerId && activeRefresh) {
    await persistClinicRefreshToken(activeCustomerId, activeRefresh);
  }

  await drainActiveClinic(activeCustomerId);

  const deviceId = await getOrCreateDeviceId();
  const response = await httpClient.post<WireAuthSession>(
    AUTH_REFRESH_PATH,
    { refresh_token: targetRefresh, device_id: deviceId },
    { skipAuth: true },
  );
  const session = mapAuthSession(response.data);
  const { shouldSync } = await finishClinicHandoff(
    targetId,
    session,
    queryClient,
    skipSync,
  );
  return { restored: true, shouldSync };
}

/**
 * Ordered clinic switch / account activate protocol.
 * Prefer membership switch; otherwise restore a stored per-clinic session.
 * The switching overlay ends as soon as the target DB is active so the UI can
 * settle; post-switch sync continues without blocking that overlay.
 */
export async function switchClinic({
  targetCustomerId,
  queryClient,
  skipSync = false,
}: SwitchClinicOptions): Promise<void> {
  const targetId = canonicalCustomerId(targetCustomerId) ?? targetCustomerId;
  const store = useAuthStore.getState();
  const activeCustomerId = store.customerId;
  const refreshToken = store.refreshToken;
  const switchUi = useClinicSwitchStore.getState();

  if (!activeCustomerId) {
    throw new ClinicSwitchError(t("settings:clinics.error.noActive"));
  }

  if (!isClinicSwitchEnabled()) {
    throw new ClinicSwitchError(t("settings:clinics.error.disabled"));
  }

  if (sameCustomerId(activeCustomerId, targetId)) {
    await clinicDatabaseManager.ensureActive(targetId);
    return;
  }

  switchUi.beginSwitch();
  stopPeriodicSync();
  stopConnectivitySync();

  try {
    const memberships = await listClinics();
    const allowed = memberships.clinics.some(
      (clinic) =>
        sameCustomerId(clinic.customerId, targetId) && clinic.isActive,
    );

    let shouldSync = false;

    if (allowed) {
      await drainActiveClinic(activeCustomerId);

      const deviceId = await getOrCreateDeviceId();
      const session = await switchClinicSession({
        customerId: targetId,
        refreshToken,
        deviceId,
      });

      ({ shouldSync } = await finishClinicHandoff(
        targetId,
        session,
        queryClient,
        skipSync,
      ));
    } else {
      const restored = await restoreClinicFromStoredRefresh(
        targetId,
        activeCustomerId,
        refreshToken,
        queryClient,
        skipSync,
      );
      if (!restored.restored) {
        throw new ClinicSwitchError(t("settings:clinics.error.sessionRequired"));
      }
      shouldSync = restored.shouldSync;
    }

    // Drop the overlay before sync so the new clinic UI can settle immediately.
    switchUi.endSwitch();

    if (shouldSync) {
      await synchronize(targetId);
    }
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
          : t("settings:clinics.switchErrorGeneric");
    switchUi.failSwitch(message);
    throw error;
  }
}
