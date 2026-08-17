import { Model, Query } from "@nozbe/watermelondb";
import { children, text } from "@nozbe/watermelondb/decorators";

import type Appointment from "./Appointment";

export default class Location extends Model {
  static table = "locations";
  static associations = {
    appointments: { type: "has_many", foreignKey: "location_id" },
  } as const;

  @text("name_en") nameEn!: string;
  @text("name_ar") nameAr!: string | null;
  @text("name_fr") nameFr!: string | null;

  @children("appointments") appointments!: Query<Appointment>;
}
