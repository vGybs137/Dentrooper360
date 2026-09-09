import { Database } from "@nozbe/watermelondb";
import { hasUnsyncedChanges as watermelonHasUnsyncedChanges } from "@nozbe/watermelondb/sync";

import {
  clearClinicRegistry,
  getOrCreateClinicRegistryEntry,
  listWarmClinicIds,
  markClinicOpened,
  removeClinicRegistryEntry,
  type ClinicRegistryEntry,
} from "./ClinicRegistry";
import { createClinicDatabase } from "./createClinicDatabase";

/**
 * Owns per-customerId WatermelonDB instances. Phase 1 keeps existing call sites
 * working via the active-database proxy in `database/index.ts`.
 */
class ClinicDatabaseManager {
  private activeCustomerId: string | null = null;
  private readonly openDatabases = new Map<string, Database>();
  private readonly inFlightOpens = new Map<string, Promise<Database>>();

  getActiveCustomerId(): string | null {
    return this.activeCustomerId;
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
    const normalized = customerId.trim();
    if (!normalized) {
      throw new Error("customerId is required to open a clinic database.");
    }

    if (this.activeCustomerId === normalized && this.openDatabases.has(normalized)) {
      return this.openDatabases.get(normalized)!;
    }

    return this.setActive(normalized);
  }

  async setActive(customerId: string): Promise<Database> {
    const database = await this.getOrOpen(customerId);
    this.activeCustomerId = customerId;
    await markClinicOpened(customerId);
    return database;
  }

  async getOrOpen(customerId: string): Promise<Database> {
    const existing = this.openDatabases.get(customerId);
    if (existing) {
      return existing;
    }

    const inFlight = this.inFlightOpens.get(customerId);
    if (inFlight) {
      return inFlight;
    }

    const openPromise = (async () => {
      const entry = await getOrCreateClinicRegistryEntry(customerId);
      const database = createClinicDatabase(entry.dbName);
      this.openDatabases.set(customerId, database);
      return database;
    })().finally(() => {
      if (this.inFlightOpens.get(customerId) === openPromise) {
        this.inFlightOpens.delete(customerId);
      }
    });

    this.inFlightOpens.set(customerId, openPromise);
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

  async deleteClinicData(customerId: string): Promise<void> {
    const database = await this.getOrOpen(customerId);
    const unsynced = await watermelonHasUnsyncedChanges({ database });
    if (unsynced) {
      throw new Error(
        "Cannot remove clinic data while there are unsynced local changes. Sync first.",
      );
    }

    await database.write(async () => {
      await database.unsafeResetDatabase();
    });

    this.openDatabases.delete(customerId);
    if (this.activeCustomerId === customerId) {
      this.activeCustomerId = null;
    }

    await removeClinicRegistryEntry(customerId);
  }

  /**
   * Support / settings wipe: reset every warm clinic DB we know about, then clear registry.
   * Unsynced data is intentionally discarded (same as previous clearApplicationData).
   */
  async resetAll(): Promise<void> {
    const warmIds = await listWarmClinicIds();
    const customerIds = new Set<string>([
      ...warmIds,
      ...this.openDatabases.keys(),
      ...(this.activeCustomerId ? [this.activeCustomerId] : []),
    ]);

    for (const customerId of customerIds) {
      const database = await this.getOrOpen(customerId);
      await database.write(async () => {
        await database.unsafeResetDatabase();
      });
    }

    this.openDatabases.clear();
    this.activeCustomerId = null;
    await clearClinicRegistry();
  }

  async getRegistryEntry(customerId: string): Promise<ClinicRegistryEntry> {
    return getOrCreateClinicRegistryEntry(customerId);
  }
}

export const clinicDatabaseManager = new ClinicDatabaseManager();
