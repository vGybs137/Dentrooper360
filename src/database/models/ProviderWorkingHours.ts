import { Model } from "@nozbe/watermelondb";
import { field, text } from "@nozbe/watermelondb/decorators";

export default class ProviderWorkingHours extends Model {
  static table = "provider_working_hours";

  @text("provider_id") providerId!: string;
  @field("day_of_week") dayOfWeek!: number;
  @text("start_hour") startHour!: string;
  @text("end_hour") endHour!: string;
}
