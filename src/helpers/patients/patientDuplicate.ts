import { Q } from "@nozbe/watermelondb";

import { clinicDatabaseManager } from "@/database/ClinicDatabaseManager";
import type Patient from "@/database/models/Patient";

export type PatientIdentityFields = {
  firstName: string;
  fatherName: string;
  lastName: string;
  countryCode: string;
  phoneNumber: string;
};

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePhone(countryCode: string, phoneNumber: string): string {
  return `${countryCode}${phoneNumber}`.replace(/\D/g, "");
}

function patientMatchesIdentity(
  patient: Patient,
  identity: PatientIdentityFields,
): boolean {
  const targetPhone = normalizePhone(identity.countryCode, identity.phoneNumber);

  return (
    normalizeName(patient.firstName ?? "") ===
      normalizeName(identity.firstName) &&
    normalizeName(patient.fatherName ?? "") ===
      normalizeName(identity.fatherName) &&
    normalizeName(patient.lastName ?? "") === normalizeName(identity.lastName) &&
    normalizePhone(patient.countryCode ?? "", patient.phoneNumber ?? "") ===
      targetPhone
  );
}

export async function findDuplicatePatient(
  identity: PatientIdentityFields,
  excludePatientId?: string | null,
): Promise<Patient | null> {
  const database = clinicDatabaseManager.requireActive();
  const phoneDigits = normalizePhone(identity.countryCode, identity.phoneNumber);
  if (!phoneDigits) {
    return null;
  }

  const patients = await database
    .get<Patient>("patients")
    .query(Q.where("is_active", true))
    .fetch();

  return (
    patients.find(
      (patient) =>
        patient.id !== excludePatientId &&
        patientMatchesIdentity(patient, identity),
    ) ?? null
  );
}
