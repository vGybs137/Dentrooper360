export type SyncTableChanges = {
  created: Record<string, unknown>[];
  updated: Record<string, unknown>[];
  deleted: string[];
};
