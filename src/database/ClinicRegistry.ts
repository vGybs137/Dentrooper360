import { CLINIC_REGISTRY_KEY } from "@/constants/storage";
import { getItem, setItem } from "@/helpers/auth/secureStorage";

import { clinicDbNameForCustomer, LEGACY_CLINIC_DB_NAME } from "./clinicDbNames";

export type ClinicRegistryEntry = {
  customerId: string;
  dbName: string;
  isWarm: boolean;
  lastOpenedAt: string | null;
  lastSuccessfulSyncAt: string | null;
  syncScope: string | null;
  scopeVersion: number | null;
};

export type ClinicRegistryState = {
  version: 1;
  /** Once true, the legacy `watermelon` file has been claimed by a customerId. */
  legacyClaimed: boolean;
  activeCustomerId: string | null;
  clinics: Record<string, ClinicRegistryEntry>;
};

const EMPTY_REGISTRY: ClinicRegistryState = {
  version: 1,
  legacyClaimed: false,
  activeCustomerId: null,
  clinics: {},
};

function isRegistryState(value: unknown): value is ClinicRegistryState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as ClinicRegistryState;
  return (
    candidate.version === 1 &&
    typeof candidate.legacyClaimed === "boolean" &&
    typeof candidate.clinics === "object" &&
    candidate.clinics !== null
  );
}

export async function loadClinicRegistry(): Promise<ClinicRegistryState> {
  const raw = await getItem(CLINIC_REGISTRY_KEY);
  if (!raw) {
    return { ...EMPTY_REGISTRY, clinics: {} };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRegistryState(parsed)) {
      return { ...EMPTY_REGISTRY, clinics: {} };
    }

    return {
      version: 1,
      legacyClaimed: parsed.legacyClaimed,
      activeCustomerId: parsed.activeCustomerId ?? null,
      clinics: { ...parsed.clinics },
    };
  } catch {
    return { ...EMPTY_REGISTRY, clinics: {} };
  }
}

async function saveClinicRegistry(state: ClinicRegistryState): Promise<void> {
  await setItem(CLINIC_REGISTRY_KEY, JSON.stringify(state));
}

export async function clearClinicRegistry(): Promise<void> {
  await setItem(CLINIC_REGISTRY_KEY, null);
}

/**
 * Returns the registry row for a clinic, creating one if needed.
 * The first clinic on a device claims the legacy `watermelon` DB name so
 * upgrades keep local data without a file copy. Later clinics get `clinic_*`.
 */
export async function getOrCreateClinicRegistryEntry(
  customerId: string,
): Promise<ClinicRegistryEntry> {
  const state = await loadClinicRegistry();
  const existing = state.clinics[customerId];
  if (existing) {
    return existing;
  }

  const claimLegacy = !state.legacyClaimed;
  const entry: ClinicRegistryEntry = {
    customerId,
    dbName: claimLegacy ? LEGACY_CLINIC_DB_NAME : clinicDbNameForCustomer(customerId),
    isWarm: true,
    lastOpenedAt: null,
    lastSuccessfulSyncAt: null,
    syncScope: null,
    scopeVersion: null,
  };

  state.clinics[customerId] = entry;
  if (claimLegacy) {
    state.legacyClaimed = true;
  }

  await saveClinicRegistry(state);
  return entry;
}

export async function markClinicOpened(customerId: string): Promise<void> {
  const state = await loadClinicRegistry();
  const entry = state.clinics[customerId];
  if (!entry) {
    return;
  }

  entry.lastOpenedAt = new Date().toISOString();
  entry.isWarm = true;
  state.activeCustomerId = customerId;
  state.clinics[customerId] = entry;
  await saveClinicRegistry(state);
}

export async function markClinicSynced(customerId: string, syncedAt = new Date()): Promise<void> {
  const state = await loadClinicRegistry();
  const entry = state.clinics[customerId];
  if (!entry) {
    return;
  }

  entry.lastSuccessfulSyncAt = syncedAt.toISOString();
  state.clinics[customerId] = entry;
  await saveClinicRegistry(state);
}

export async function removeClinicRegistryEntry(customerId: string): Promise<void> {
  const state = await loadClinicRegistry();
  delete state.clinics[customerId];
  if (state.activeCustomerId === customerId) {
    state.activeCustomerId = null;
  }
  await saveClinicRegistry(state);
}

export async function listWarmClinicIds(): Promise<string[]> {
  const state = await loadClinicRegistry();
  return Object.values(state.clinics)
    .filter((entry) => entry.isWarm)
    .map((entry) => entry.customerId);
}

/** Milliseconds since epoch, or null if this clinic has never synced successfully. */
export async function getClinicLastSuccessfulSyncAt(
  customerId: string,
): Promise<number | null> {
  const state = await loadClinicRegistry();
  const raw = state.clinics[customerId]?.lastSuccessfulSyncAt;
  if (!raw) {
    return null;
  }

  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * True when the clinic has completed at least one successful sync (offline-capable).
 */
export async function clinicHasSuccessfulSync(
  customerId: string,
): Promise<boolean> {
  return (await getClinicLastSuccessfulSyncAt(customerId)) != null;
}
