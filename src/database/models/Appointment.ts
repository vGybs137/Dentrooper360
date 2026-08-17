import { Model, Relation } from "@nozbe/watermelondb";
import { date, field, relation, text } from "@nozbe/watermelondb/decorators";

import type AppointmentType from "./AppointmentType";
import type Location from "./Location";
import type Patient from "./Patient";

export default class Appointment extends Model {
  static table = "appointments";
  static associations = {
    patients: { type: "belongs_to", key: "patient_id" },
    appointment_types: { type: "belongs_to", key: "type_id" },
    locations: { type: "belongs_to", key: "location_id" },
  } as const;

  @field("provider_id") providerId!: string;
  @relation("patients", "patient_id") patient!: Relation<Patient>;
  @relation("appointment_types", "type_id") type!: Relation<AppointmentType>;
  @relation("locations", "location_id") location!: Relation<Location>;
  @text("subject") subject!: string;
  @field("status") status!: string;
  @text("description") description!: string | null;
  @date("start_time") startTime!: Date;
  @date("end_time") endTime!: Date;
}
