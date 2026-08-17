import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";

import migrations from "./migrations";
import {
  Appointment,
  AppointmentType,
  Location,
  Patient,
  Payment,
  Recall,
  Service,
} from "./models";
import schema from "./schema";

const adapter = new SQLiteAdapter({
  schema,
  // (You might want to comment it out for development purposes -- see Migrations documentation)
  migrations,
  // (optional database name or file system path)
  // dbName: 'myapp',
  // (recommended option, should work flawlessly out of the box on iOS. On Android,
  // additional installation steps have to be taken - disable if you run into issues...)
  jsi: true /* Platform.OS === 'ios' */,
  // (optional, but you should implement this method)
  onSetUpError: (error) => {
    // Database failed to load -- offer the user to reload the app or log out
  },
});

const database = new Database({
  adapter,
  modelClasses: [
    AppointmentType,
    Location,
    Patient,
    Appointment,
    Service,
    Payment,
    Recall,
  ],
});

export default database;

