import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";

import migrations from "./migrations";
import {
  Appointment,
  AppointmentType,
  Location,
  Patient,
  Payment,
  ProviderWorkingHours,
  Recall,
  Service,
} from "./models";
import schema from "./schema";

const MODEL_CLASSES = [
  AppointmentType,
  Location,
  ProviderWorkingHours,
  Patient,
  Appointment,
  Service,
  Payment,
  Recall,
];

export function createClinicDatabase(dbName: string): Database {
  const adapter = new SQLiteAdapter({
    schema,
    migrations,
    dbName,
    jsi: true,
    onSetUpError: (error) => {
      console.error(`[ClinicDatabase] Failed to set up "${dbName}"`, error);
    },
  });

  return new Database({
    adapter,
    modelClasses: MODEL_CLASSES,
  });
}
