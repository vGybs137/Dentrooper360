import { Model, Query } from "@nozbe/watermelondb";
import { children, field, text } from "@nozbe/watermelondb/decorators";

import type Appointment from "./Appointment";

export default class AppointmentType extends Model {
  static table = "appointment_types";
  static associations = {
    appointments: { type: "has_many", foreignKey: "type_id" },
  } as const;

  @text("name_en") nameEn!: string;
  @text("name_ar") nameAr!: string | null;
  @text("name_fr") nameFr!: string | null;
  @field("color") color!: string | null;

  @children("appointments") appointments!: Query<Appointment>;
}
