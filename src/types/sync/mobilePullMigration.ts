import type { MobilePullMigrationColumn } from "./mobilePullMigrationColumn";

export type MobilePullMigration = {
  from: number;
  tables: string[];
  columns: MobilePullMigrationColumn[];
};
