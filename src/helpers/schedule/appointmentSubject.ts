/** Shared appointment subject (persisted) and list display title helpers. */

import { formatPatientPhone } from "@/helpers/patients/patientDisplay";
import { t } from "@/i18n";

export type AppointmentSubjectPatient = {
  displayName: string;
  countryCode?: string | null;
  phoneNumber?: string | null;
};

/**
 * Persisted subject: patient display name + phone (same as quick-add).
 * Phone omitted when missing/blank.
 */
export function buildAppointmentSubjectFromPatient(
  patient: AppointmentSubjectPatient,
): string {
  const phone = formatPatientPhone(patient.countryCode, patient.phoneNumber);
  return [patient.displayName.trim(), phone]
    .filter(Boolean)
    .join(" ");
}

/**
 * Day view + month day-events sheet title: `subject - type`.
 * Type omitted when missing/blank.
 */
export function formatAppointmentEventTitle(
  subject: string,
  typeName?: string | null,
): string {
  const trimmedSubject = subject.trim() || t("schedule:add.defaultSubject");
  const trimmedType = typeName?.trim();
  if (!trimmedType) return trimmedSubject;
  return `${trimmedSubject} - ${trimmedType}`;
}
