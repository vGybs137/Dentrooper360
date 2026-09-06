import { Model, Relation } from "@nozbe/watermelondb";
import { date, field, relation, text } from "@nozbe/watermelondb/decorators";

import type Appointment from "./Appointment";
import type Patient from "./Patient";

export default class Recall extends Model {
  static table = "recalls";
  static associations = {
    patients: { type: "belongs_to", key: "patient_id" },
    appointments: { type: "belongs_to", key: "appointment_id" },
  } as const;

  @field("provider_id") providerId!: string;
  @relation("patients", "patient_id") patient!: Relation<Patient>;
  @field("appointment_id") appointmentId!: string | null;
  @relation("appointments", "appointment_id") appointment!: Relation<Appointment>;
  @field("service_code") serviceCode!: string | null;
  @text("service_name_en") serviceNameEn!: string;
  @text("service_name_ar") serviceNameAr!: string | null;
  @text("service_name_fr") serviceNameFr!: string | null;
  @field("interval") interval!: number;
  @field("reminder_interval") reminderInterval!: number;
  @date("date") date!: Date;
  @date("due_date") dueDate!: Date;
  @text("note") note!: string | null;
  @field("is_active") isActive!: boolean;
}
