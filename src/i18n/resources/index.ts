import enCommon from "./en/common.json";
import enAuth from "./en/auth.json";
import enNavigation from "./en/navigation.json";
import enSettings from "./en/settings.json";
import enSchedule from "./en/schedule.json";
import enPatients from "./en/patients.json";
import enPayments from "./en/payments.json";
import enRecalls from "./en/recalls.json";
import enSync from "./en/sync.json";
import enErrors from "./en/errors.json";
import enValidation from "./en/validation.json";
import enA11y from "./en/a11y.json";

import frCommon from "./fr/common.json";
import frAuth from "./fr/auth.json";
import frNavigation from "./fr/navigation.json";
import frSettings from "./fr/settings.json";
import frSchedule from "./fr/schedule.json";
import frPatients from "./fr/patients.json";
import frPayments from "./fr/payments.json";
import frRecalls from "./fr/recalls.json";
import frSync from "./fr/sync.json";
import frErrors from "./fr/errors.json";
import frValidation from "./fr/validation.json";
import frA11y from "./fr/a11y.json";

import arCommon from "./ar/common.json";
import arAuth from "./ar/auth.json";
import arNavigation from "./ar/navigation.json";
import arSettings from "./ar/settings.json";
import arSchedule from "./ar/schedule.json";
import arPatients from "./ar/patients.json";
import arPayments from "./ar/payments.json";
import arRecalls from "./ar/recalls.json";
import arSync from "./ar/sync.json";
import arErrors from "./ar/errors.json";
import arValidation from "./ar/validation.json";
import arA11y from "./ar/a11y.json";

export const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    navigation: enNavigation,
    settings: enSettings,
    schedule: enSchedule,
    patients: enPatients,
    payments: enPayments,
    recalls: enRecalls,
    sync: enSync,
    errors: enErrors,
    validation: enValidation,
    a11y: enA11y,
  },
  fr: {
    common: frCommon,
    auth: frAuth,
    navigation: frNavigation,
    settings: frSettings,
    schedule: frSchedule,
    patients: frPatients,
    payments: frPayments,
    recalls: frRecalls,
    sync: frSync,
    errors: frErrors,
    validation: frValidation,
    a11y: frA11y,
  },
  ar: {
    common: arCommon,
    auth: arAuth,
    navigation: arNavigation,
    settings: arSettings,
    schedule: arSchedule,
    patients: arPatients,
    payments: arPayments,
    recalls: arRecalls,
    sync: arSync,
    errors: arErrors,
    validation: arValidation,
    a11y: arA11y,
  },
} as const;

export const namespaces = [
  "common",
  "auth",
  "navigation",
  "settings",
  "schedule",
  "patients",
  "payments",
  "recalls",
  "sync",
  "errors",
  "validation",
  "a11y",
] as const;
