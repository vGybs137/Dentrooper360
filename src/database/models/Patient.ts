import { Model, Query } from "@nozbe/watermelondb";
import { children, date, field, text } from "@nozbe/watermelondb/decorators";

import type Appointment from "./Appointment";
import type Payment from "./Payment";
import type Recall from "./Recall";
import type Service from "./Service";

export default class Patient extends Model {
  static table = "patients";
  static associations = {
    appointments: { type: "has_many", foreignKey: "patient_id" },
    services: { type: "has_many", foreignKey: "patient_id" },
    payments: { type: "has_many", foreignKey: "patient_id" },
    recalls: { type: "has_many", foreignKey: "patient_id" },
  } as const;

  @field("currency") currency!: string | null;
  @field("is_vip") isVip!: boolean;
  @date("vip_status_date") vipStatusDate!: Date | null;
  @field("balance") balance!: number;
  @field("gender") gender!: string | null;
  @field("blood_type") bloodType!: string | null;
  @field("title") title!: string | null;
  @text("first_name") firstName!: string | null;
  @text("father_name") fatherName!: string | null;
  @text("last_name") lastName!: string | null;
  @date("birth_date") birthDate!: Date | null;
  @text("address") address!: string | null;
  @field("country_code") countryCode!: string | null;
  @field("phone_number") phoneNumber!: string | null;
  @field("email_address") emailAddress!: string | null;
  @field("is_active") isActive!: boolean;
  @field("profile_photo") profilePhoto!: string | null;

  @children("appointments") appointments!: Query<Appointment>;
  @children("services") services!: Query<Service>;
  @children("payments") payments!: Query<Payment>;
  @children("recalls") recalls!: Query<Recall>;
}
