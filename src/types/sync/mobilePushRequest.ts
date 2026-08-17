import type { SyncTableChanges } from "./syncTableChanges";
import type { SyncTableName } from "./syncTableName";

export type MobilePushRequest = {
  customerId: string;
  lastPulledAt?: number | null;
  changes: Partial<Record<SyncTableName, SyncTableChanges>>;
};
