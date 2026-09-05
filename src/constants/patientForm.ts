export const DEFAULT_PATIENT_COUNTRY_CODE = "+961";

export const PATIENT_GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
] as const;

export type PatientGenderValue =
  (typeof PATIENT_GENDER_OPTIONS)[number]["value"];

export const PATIENT_FORM_VALIDATION_MESSAGES = {
  firstNameRequired: "First name is required",
  lastNameRequired: "Last name is required",
  countryCodeRequired: "Zip is required",
  phoneNumberRequired: "Phone number is required",
} as const;
