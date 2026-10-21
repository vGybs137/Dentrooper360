import { Database } from "@nozbe/watermelondb";
import { hasUnsyncedChanges as watermelonHasUnsyncedChanges } from "@nozbe/watermelondb/sync";

import { isWarmLruDemoteEnabled } from "@/constants/multiClinicFlags";
import { canonicalCustomerId } from "@/helpers/auth/customerId";
import { useAuthStore } from "@/stores";

import { closeClinicDatabase } from "./closeClinicDatabase";
import {
  deleteClinicSqliteFiles,
  getFreeDiskBytes,
  queuePendingClinicSqliteDeletes,
} from "./clinicSqliteFiles";
import {
  clearClinicRegistry,
  getOrCreateClinicRegistryEntry,
  isClinicWarm,
  listWarmClinicIds,
  listWarmClinicsByLru,
  loadClinicRegistry,
  markClinicCold,
  markClinicOpened,
  removeClinicRegistryEntry,
  type ClinicRegistryEntry,
} from "./ClinicRegistry";
import { LEGACY_CLINIC_DB_NAME } from "./clinicDbNames";
import { waitForClinicSyncIdle } from "./clinicSyncLock";
import { createClinicDatabase } from "./createClinicDatabase";
import {
  recordDemoteBlockedUnsynced,
  recordDemoteSkippedActive,
  recordDemoteSucceeded,
  recordWarmCount,
} from "./warmClinicMetrics";
import { resolveWarmClinicPolicy } from "./warmClinicPolicy";

export type DemoteClinicResult =
  | "demoted"
  | "blocked_unsynced"
  | "skipped_active"
  | "not_warm";

/**
 * Owns per-customerId WatermelonDB instances.
 * setActive waits for in-flight sync, then enforces the warm-clinic LRU budget.
 */
class ClinicDatabaseManager {
  private activeCustomerId: string | null = null;
  private readonly openDatabases = new Map<string, Database>();
  private readonly inFlightOpens = new Map<string, Promise<Database>>();
  private enforceBudgetChain: Promise<void> = Promise.resolve();
  /** When true, refuse new opens so wipe/remove can close + unlink files. */
  private exclusiveWipe = false;

  getActiveCustomerId(): string | null {
    return this.activeCustomerId;
  }

  beginExclusiveWipe(): void {
    this.exclusiveWipe = true;
  }

  endExclusiveWipe(): void {
    this.exclusiveWipe = false;
  }

  isExclusiveWipe(): boolean {
    return this.exclusiveWipe;
  }

  /** Map handles opened under a differently cased id onto the canonical key. */
  private adoptId(customerId: string): string {
    const id = canonicalCustomerId(customerId);
    if (!id) {
      throw new Error("customerId is required to open a clinic database.");
    }

    if (
      this.activeCustomerId &&
      canonicalCustomerId(this.activeCustomerId) === id
    ) {
      this.activeCustomerId = id;
    }

    for (const key of [...this.openDatabases.keys()]) {
      if (canonicalCustomerId(key) !== id || key === id) {
        continue;
      }

      const database = this.openDatabases.get(key);
      this.openDatabases.delete(key);
      if (database && !this.openDatabases.has(id)) {
        this.openDatabases.set(id, database);
      }
    }

    for (const key of [...this.inFlightOpens.keys()]) {
      if (canonicalCustomerId(key) !== id || key === id) {
        continue;
      }

      const opening = this.inFlightOpens.get(key);
      this.inFlightOpens.delete(key);
      if (opening && !this.inFlightOpens.has(id)) {
        this.inFlightOpens.set(id, opening);
      }
    }

    return id;
  }

  requireActive(): Database {
    if (!this.activeCustomerId) {
      throw new Error(
        "Clinic database is not ready. Call clinicDatabaseManager.ensureActive(customerId) first.",
      );
    }

    const database = this.openDatabases.get(this.activeCustomerId);
    if (!database) {
      throw new Error(
        `Clinic database for ${this.activeCustomerId} is not open. Call ensureActive first.`,
      );
    }

    return database;
  }

  tryGetActive(): Database | null {
    if (!this.activeCustomerId) {
      return null;
    }

    return this.openDatabases.get(this.activeCustomerId) ?? null;
  }

  async ensureActive(customerId: string): Promise<Database> {
    const normalized = this.adoptId(customerId);

    if (this.activeCustomerId === normalized && this.openDatabases.has(normalized)) {
      return this.openDatabases.get(normalized)!;
    }

    return this.setActive(normalized);
  }

  /**
   * Opens the clinic DB (recreating the file after demotion), marks it warm/active,
   * then demotes LRU victims until under budget.
   */
  async setActive(customerId: string): Promise<Database> {
    const id = this.adoptId(customerId);
    const previous = this.activeCustomerId;
    if (previous && previous !== id) {
      await waitForClinicSyncIdle(previous);
    }
    await waitForClinicSyncIdle(id);

    const database = await this.getOrOpen(id);
    this.activeCustomerId = id;
    await markClinicOpened(id);
    await this.enforceWarmBudget(id);
    return database;
  }

  async getOrOpen(customerId: string): Promise<Database> {
    if (this.exclusiveWipe) {
      throw new Error(
        "Clinic database opens are suspended while local data is being cleared.",
      );
    }

    const id = this.adoptId(customerId);
    const existing = this.openDatabases.get(id);
    if (existing) {
      return existing;
    }

    const inFlight = this.inFlightOpens.get(id);
    if (inFlight) {
      return inFlight;
    }

    const openPromise = (async () => {
      const entry = await getOrCreateClinicRegistryEntry(id);
      const database = createClinicDatabase(entry.dbName);
      this.openDatabases.set(id, database);
      return database;
    })().finally(() => {
      if (this.inFlightOpens.get(id) === openPromise) {
        this.inFlightOpens.delete(id);
      }
    });

    this.inFlightOpens.set(id, openPromise);
    return openPromise;
  }

  async hasUnsyncedChanges(customerId?: string): Promise<boolean> {
    const id = customerId ?? this.activeCustomerId;
    if (!id) {
      return false;
    }

    const database = await this.getOrOpen(id);
    return watermelonHasUnsyncedChanges({ database });
  }

  /**
   * True when the clinic was previously demoted (registry row exists, isWarm false).
   * Call before setActive — opening marks the clinic warm again.
   */
  async wasColdBeforeOpen(customerId: string): Promise<boolean> {
    const id = canonicalCustomerId(customerId);
    if (!id) {
      return false;
    }

    const state = await loadClinicRegistry();
    const entry = state.clinics[id];
    if (!entry) {
      return false;
    }
    return !entry.isWarm;
  }

  /**
   * Demotes a non-active warm clinic: refuse if unsynced, otherwise close + delete
   * SQLite files and mark cold in the registry.
   */
  async demoteClinic(customerId: string): Promise<DemoteClinicResult> {
    const normalized = canonicalCustomerId(customerId);
    if (!normalized) {
      return "not_warm";
    }

    this.adoptId(normalized);
    if (this.activeCustomerId === normalized) {
      recordDemoteSkippedActive();
      return "skipped_active";
    }

    if (!(await isClinicWarm(normalized))) {
      return "not_warm";
    }

    await waitForClinicSyncIdle(normalized);

    const entry = await getOrCreateClinicRegistryEntry(normalized);
    const database = await this.getOrOpen(normalized);
    const unsynced = await watermelonHasUnsyncedChanges({ database });

    if (unsynced) {
      // Cannot sync another clinic's outbox under the active JWT (Phase 3 binding).
      // Only attempt drain when the session still matches this clinic.
      const sessionCustomerId = canonicalCustomerId(
        useAuthStore.getState().customerId,
      );
      if (sessionCustomerId === normalized) {
        try {
          const { synchronize } = await import("./synchronize");
          await synchronize(normalized);
        } catch {
          // fall through to re-check
        }
      }

      const stillUnsynced = await watermelonHasUnsyncedChanges({ database });
      if (stillUnsynced) {
        recordDemoteBlockedUnsynced();
        return "blocked_unsynced";
      }
    }

    await this.closeOpenHandle(normalized);
    await deleteClinicSqliteFiles(entry.dbName);
    await markClinicCold(normalized);
    recordDemoteSucceeded();
    return "demoted";
  }

  /**
   * While warm count exceeds maxWarmClinics or free disk is below the floor,
   * demote the LRU non-active warm clinic. Stops when no eligible victim remains.
   */
  async enforceWarmBudget(activeCustomerId?: string | null): Promise<void> {
    const run = this.enforceBudgetChain.then(() =>
      this.runEnforceWarmBudget(activeCustomerId ?? this.activeCustomerId),
    );
    this.enforceBudgetChain = run.then(
      () => undefined,
      () => undefined,
    );
    await run;
  }

  private async runEnforceWarmBudget(
    activeCustomerId: string | null,
  ): Promise<void> {
    if (!isWarmLruDemoteEnabled()) {
      const warm = await listWarmClinicsByLru();
      recordWarmCount(warm.length);
      return;
    }

    const policy = resolveWarmClinicPolicy();
    const maxAttempts = 8;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const warm = await listWarmClinicsByLru();
      recordWarmCount(warm.length);

      const freeDisk = await getFreeDiskBytes();
      const overCount = warm.length > policy.maxWarmClinics;
      const lowDisk =
        freeDisk != null && freeDisk < policy.minFreeDiskBytes && warm.length > 1;

      if (!overCount && !lowDisk) {
        return;
      }

      const victim = warm.find(
        (entry) => entry.customerId !== activeCustomerId,
      );
      if (!victim) {
        return;
      }

      const result = await this.demoteClinic(victim.customerId);
      if (result !== "demoted") {
        // Avoid spinning on the same blocked victim.
        return;
      }
    }
  }

  private async closeOpenHandle(customerId: string): Promise<void> {
    const database = this.openDatabases.get(customerId);
    if (!database) {
      return;
    }

    this.openDatabases.delete(customerId);
    try {
      await closeClinicDatabase(database);
    } catch (error) {
      console.warn(
        `[ClinicDatabase] unsafeClose failed for ${customerId}`,
        error,
      );
    }
  }

  private async unlinkClinicFiles(dbName: string): Promise<void> {
    const deleted = await deleteClinicSqliteFiles(dbName);
    if (!deleted) {
      await queuePendingClinicSqliteDeletes([dbName]);
    }
  }

  async deleteClinicData(customerId: string): Promise<void> {
    const id = this.adoptId(customerId);
    await waitForClinicSyncIdle(id);

    const openDb = this.openDatabases.get(id);
    if (openDb) {
      const unsynced = await watermelonHasUnsyncedChanges({ database: openDb });
      if (unsynced) {
        throw new Error(
          "Cannot remove clinic data while there are unsynced local changes. Sync first.",
        );
      }
    }

    // Close + delete SQLite files only. Never synchronize here: wiping rows via
    // Watermelon then pushing would tombstone server PHI.
    const registry = await loadClinicRegistry();
    const entry = registry.clinics[id];
    await this.closeOpenHandle(id);
    if (entry?.dbName) {
      await this.unlinkClinicFiles(entry.dbName);
    }

    if (this.activeCustomerId === id) {
      this.activeCustomerId = null;
    }

    await removeClinicRegistryEntry(id);
  }

  /**
   * Support / settings wipe: wait for sync idle, close + delete every known clinic
   * file, then clear registry. Unsynced rows are intentionally discarded.
   * Caller should hold {@link beginExclusiveWipe} and clear auth customerId first
   * so ClinicSessionProvider does not reopen a connection mid-wipe.
   */
  async resetAll(): Promise<void> {
    const warmIds = await listWarmClinicIds();
    const registry = await loadClinicRegistry();
    const customerIds = new Set<string>([
      ...warmIds,
      ...Object.keys(registry.clinics),
      ...this.openDatabases.keys(),
      ...(this.activeCustomerId ? [this.activeCustomerId] : []),
    ]);

    const dbNames = new Set<string>([LEGACY_CLINIC_DB_NAME]);
    for (const customerId of customerIds) {
      await waitForClinicSyncIdle(customerId);
      const entry = registry.clinics[customerId];
      if (entry?.dbName) {
        dbNames.add(entry.dbName);
      }
      await this.closeOpenHandle(customerId);
    }

    // Drop any handles that arrived under alternate keys.
    for (const customerId of [...this.openDatabases.keys()]) {
      await this.closeOpenHandle(customerId);
    }

    this.openDatabases.clear();
    this.activeCustomerId = null;

    // Brief pause so native SQLite can finish releasing file locks after close.
    await new Promise((resolve) => setTimeout(resolve, 100));

    for (const dbName of dbNames) {
      await this.unlinkClinicFiles(dbName);
    }

    await clearClinicRegistry();
  }

  async getRegistryEntry(customerId: string): Promise<ClinicRegistryEntry> {
    return getOrCreateClinicRegistryEntry(customerId);
  }
}

export const clinicDatabaseManager = new ClinicDatabaseManager();
