import { CLINIC_REGISTRY_KEY } from "@/constants/storage";
import { canonicalCustomerId } from "@/helpers/auth/customerId";
import { getItem, setItem } from "@/security/vault/secureStorage";

import { clinicDbNameForCustomer, LEGACY_CLINIC_DB_NAME } from "./clinicDbNames";
import { sortClinicsByLru } from "./clinicLru";

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

function preferRegistryEntry(
  current: ClinicRegistryEntry,
  incoming: ClinicRegistryEntry,
): ClinicRegistryEntry {
  const currentSynced = Date.parse(current.lastSuccessfulSyncAt ?? "");
  const incomingSynced = Date.parse(incoming.lastSuccessfulSyncAt ?? "");
  const incomingIsNewer =
    Number.isFinite(incomingSynced) &&
    (!Number.isFinite(currentSynced) || incomingSynced > currentSynced);

  return {
    ...current,
    customerId: incoming.customerId,
    isWarm: current.isWarm || incoming.isWarm,
    lastOpenedAt: incoming.lastOpenedAt ?? current.lastOpenedAt,
    lastSuccessfulSyncAt: incomingIsNewer
      ? incoming.lastSuccessfulSyncAt
      : current.lastSuccessfulSyncAt,
    syncScope: incoming.syncScope ?? current.syncScope,
    scopeVersion: incoming.scopeVersion ?? current.scopeVersion,
    dbName: current.dbName || incoming.dbName,
  };
}

/** Collapses QR uppercase and server lowercase ids onto one registry row. */
export function canonicalizeClinicRegistry(
  state: ClinicRegistryState,
): ClinicRegistryState {
  const clinics: Record<string, ClinicRegistryEntry> = {};

  for (const [key, entry] of Object.entries(state.clinics)) {
    const id = canonicalCustomerId(entry.customerId) ?? canonicalCustomerId(key);
    if (!id) {
      continue;
    }

    const next = { ...entry, customerId: id };
    const existing = clinics[id];
    clinics[id] = existing ? preferRegistryEntry(existing, next) : next;
  }

  return {
    ...state,
    activeCustomerId: canonicalCustomerId(state.activeCustomerId),
    clinics,
  };
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

    return canonicalizeClinicRegistry({
      version: 1,
      legacyClaimed: parsed.legacyClaimed,
      activeCustomerId: parsed.activeCustomerId ?? null,
      clinics: { ...parsed.clinics },
    });
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
  const id = canonicalCustomerId(customerId);
  if (!id) {
    throw new Error("customerId is required to register a clinic database.");
  }

  const state = await loadClinicRegistry();
  const existing = state.clinics[id];
  if (existing) {
    return existing;
  }

  const claimLegacy = !state.legacyClaimed;
  const entry: ClinicRegistryEntry = {
    customerId: id,
    dbName: claimLegacy ? LEGACY_CLINIC_DB_NAME : clinicDbNameForCustomer(id),
    isWarm: true,
    lastOpenedAt: null,
    lastSuccessfulSyncAt: null,
    syncScope: null,
    scopeVersion: null,
  };

  state.clinics[id] = entry;
  if (claimLegacy) {
    state.legacyClaimed = true;
  }

  await saveClinicRegistry(state);
  return entry;
}

export async function markClinicOpened(customerId: string): Promise<void> {
  const id = canonicalCustomerId(customerId);
  if (!id) {
    return;
  }

  const state = await loadClinicRegistry();
  const entry = state.clinics[id];
  if (!entry) {
    return;
  }

  entry.lastOpenedAt = new Date().toISOString();
  entry.isWarm = true;
  state.activeCustomerId = id;
  state.clinics[id] = entry;
  await saveClinicRegistry(state);
}

export async function markClinicSynced(
  customerId: string,
  syncedAt = new Date(),
  syncScope?: string | null,
  scopeVersion?: number | null,
): Promise<void> {
  const id = canonicalCustomerId(customerId);
  if (!id) {
    return;
  }

  const state = await loadClinicRegistry();
  const entry = state.clinics[id];
  if (!entry) {
    return;
  }

  entry.lastSuccessfulSyncAt = syncedAt.toISOString();
  if (syncScope !== undefined) {
    entry.syncScope = syncScope;
  }
  if (scopeVersion !== undefined) {
    entry.scopeVersion = scopeVersion;
  }
  state.clinics[id] = entry;
  await saveClinicRegistry(state);
}

export async function removeClinicRegistryEntry(customerId: string): Promise<void> {
  const id = canonicalCustomerId(customerId);
  if (!id) {
    return;
  }

  const state = await loadClinicRegistry();
  delete state.clinics[id];
  if (state.activeCustomerId === id) {
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

/** Pure LRU ordering: oldest lastOpenedAt first; null/invalid timestamps sort first. */
export { sortClinicsByLru } from "./clinicLru";

/** Warm clinics oldest-first (LRU victims). Null lastOpenedAt sorts first. */
export async function listWarmClinicsByLru(): Promise<ClinicRegistryEntry[]> {
  const state = await loadClinicRegistry();
  return sortClinicsByLru(Object.values(state.clinics).filter((entry) => entry.isWarm));
}

export async function isClinicWarm(customerId: string): Promise<boolean> {
  const id = canonicalCustomerId(customerId);
  if (!id) {
    return false;
  }

  const state = await loadClinicRegistry();
  return state.clinics[id]?.isWarm === true;
}

/**
 * Marks a clinic cold after demotion. Clears lastSuccessfulSyncAt so offline
 * enter requires a fresh online first-sync into the recreated file.
 */
export async function markClinicCold(customerId: string): Promise<void> {
  const id = canonicalCustomerId(customerId);
  if (!id) {
    return;
  }

  const state = await loadClinicRegistry();
  const entry = state.clinics[id];
  if (!entry) {
    return;
  }

  entry.isWarm = false;
  entry.lastSuccessfulSyncAt = null;
  state.clinics[id] = entry;
  if (state.activeCustomerId === id) {
    state.activeCustomerId = null;
  }
  await saveClinicRegistry(state);
}

/** Milliseconds since epoch, or null if this clinic has never synced successfully. */
export async function getClinicLastSuccessfulSyncAt(
  customerId: string,
): Promise<number | null> {
  const id = canonicalCustomerId(customerId);
  if (!id) {
    return null;
  }

  const state = await loadClinicRegistry();
  const raw = state.clinics[id]?.lastSuccessfulSyncAt;
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
