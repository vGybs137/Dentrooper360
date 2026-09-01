export const DEFAULT_PATIENT_COUNTRY_CODE = "+961";
export const DEFAULT_PATIENT_GENDER = "Male";

export const PATIENT_GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
] as const;

export type PatientGenderValue =
  (typeof PATIENT_GENDER_OPTIONS)[number]["value"];
