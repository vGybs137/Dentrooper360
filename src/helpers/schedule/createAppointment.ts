import dayjs from "dayjs";

import type Appointment from "@/database/models/Appointment";
import { generateGuid } from "@/helpers/ui/guid";

export const DEFAULT_APPOINTMENT_STATUS = "New";

/** Next whole hour from now — shared default for new appointment slots. */
export function defaultAppointmentStart(): Date {
  return dayjs().add(1, "hour").startOf("hour").toDate();
}

export type NewAppointmentFields = {
  providerId: string;
  patientId: string | null;
  typeId: string | null;
  locationId: string;
  subject: string;
  description?: string | null;
  startTime: Date;
  endTime: Date;
};

/** Apply create fields for a new appointment (status `New`, new guid). */
export function applyNewAppointmentFields(
  record: Appointment,
  fields: NewAppointmentFields,
): void {
  record._raw.id = generateGuid();
  record.providerId = fields.providerId;
  record.patientId = fields.patientId;
  record.typeId = fields.typeId;
  record.locationId = fields.locationId;
  record.subject = fields.subject;
  record.status = DEFAULT_APPOINTMENT_STATUS;
  record.description = fields.description?.trim() || null;
  record.startTime = fields.startTime;
  record.endTime = fields.endTime;
}
