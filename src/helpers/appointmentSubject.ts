/** Shared appointment subject (persisted) and list display title helpers. */

export type AppointmentSubjectPatient = {
  displayName: string;
  phoneNumber?: string | null;
};

/**
 * Persisted subject: patient display name + phone (same as quick-add).
 * Phone omitted when missing/blank.
 */
export function buildAppointmentSubjectFromPatient(
  patient: AppointmentSubjectPatient,
): string {
  return [patient.displayName.trim(), patient.phoneNumber?.trim()]
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
  const trimmedSubject = subject.trim() || "Appointment";
  const trimmedType = typeName?.trim();
  if (!trimmedType) return trimmedSubject;
  return `${trimmedSubject} - ${trimmedType}`;
}
