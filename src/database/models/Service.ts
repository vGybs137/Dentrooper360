import { Model, Relation } from "@nozbe/watermelondb";
import { date, field, relation, text } from "@nozbe/watermelondb/decorators";

import type Patient from "./Patient";

export default class Service extends Model {
  static table = "services";
  static associations = {
    patients: { type: "belongs_to", key: "patient_id" },
  } as const;

  @field("provider_id") providerId!: string;
  @relation("patients", "patient_id") patient!: Relation<Patient>;
  @field("status") status!: string;
  @field("code") code!: string | null;
  @text("name_en") nameEn!: string;
  @text("name_ar") nameAr!: string | null;
  @text("name_fr") nameFr!: string | null;
  @date("date") date!: Date;
  @text("note") note!: string | null;
  @field("fee") fee!: number;
  @field("color") color!: string | null;
  @field("status_color") statusColor!: string | null;
  @date("posted_date") postedDate!: Date | null;
  @field("is_posted") isPosted!: boolean;
}
