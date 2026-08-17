import type { MobilePullMigration } from "./mobilePullMigration";

export type MobilePullRequest = {
  customerId: string;
  lastPulledAt?: number | null;
  schemaVersion?: number | null;
  migration?: MobilePullMigration | null;
};
