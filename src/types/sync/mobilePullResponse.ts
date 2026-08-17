import type { SyncTableChanges } from "./syncTableChanges";
import type { SyncTableName } from "./syncTableName";

export type MobilePullResponse = {
  timestamp: number;
  changes: Partial<Record<SyncTableName, SyncTableChanges>>;
};
