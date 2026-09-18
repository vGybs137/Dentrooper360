export const DEFAULT_PATIENT_COUNTRY_CODE = "+961";

/** Curated dialing codes for Settings + new-patient defaults. */
export const PATIENT_COUNTRY_CODE_OPTIONS = [
  "+961",
  "+1",
  "+33",
  "+971",
  "+44",
] as const;

export const PATIENT_GENDER_VALUES = ["Male", "Female"] as const;

export type PatientGenderValue = (typeof PATIENT_GENDER_VALUES)[number];

/** Stored gender values stay English for DB compatibility; labels are translated in UI. */
export const PATIENT_GENDER_OPTIONS = [
  { value: "Male" as const, labelKey: "patients:form.gender.male" },
  { value: "Female" as const, labelKey: "patients:form.gender.female" },
] as const;

export const PATIENT_FORM_VALIDATION_KEYS = {
  firstNameRequired: "validation:patients.firstNameRequired",
  lastNameRequired: "validation:patients.lastNameRequired",
  countryCodeRequired: "validation:patients.countryCodeRequired",
  phoneNumberRequired: "validation:patients.phoneRequired",
} as const;

/** @deprecated Prefer PATIENT_FORM_VALIDATION_KEYS + t() */
export const PATIENT_FORM_VALIDATION_MESSAGES = {
  firstNameRequired: "First name is required",
  lastNameRequired: "Last name is required",
  countryCodeRequired: "Zip is required",
  phoneNumberRequired: "Phone number is required",
} as const;
