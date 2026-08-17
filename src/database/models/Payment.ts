import { Model, Relation } from "@nozbe/watermelondb";
import { date, field, relation, text } from "@nozbe/watermelondb/decorators";

import type Patient from "./Patient";

export default class Payment extends Model {
  static table = "payments";
  static associations = {
    patients: { type: "belongs_to", key: "patient_id" },
  } as const;

  @field("provider_id") providerId!: string;
  @relation("patients", "patient_id") patient!: Relation<Patient>;
  @field("type") type!: string;
  @field("method") method!: string;
  @field("currency") currency!: string;
  @field("status") status!: string;
  @field("amount") amount!: number;
  @date("date") date!: Date;
  @date("posted_date") postedDate!: Date | null;
  @text("description") description!: string | null;
  @field("is_posted") isPosted!: boolean;
  @field("is_active") isActive!: boolean;
}
