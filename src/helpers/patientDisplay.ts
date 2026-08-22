import type Patient from "@/database/models/Patient";

export type PatientCardData = {
  id: string;
  displayName: string;
  isVip: boolean;
  balance: number | null;
  currency: string | null;
  profilePhoto: string | null;
  nextVisit: string | null;
};

export function formatPatientName(patient: Pick<Patient, "firstName" | "lastName">): string {
  return [patient.firstName, patient.lastName].filter(Boolean).join(" ").trim();
}

export function formatPatientBalance(
  balance: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (balance == null || balance === 0) {
    return "---";
  }

  const prefix = currency ?? "$";
  return `${prefix}${Math.abs(balance).toFixed(2)}`;
}

export function formatPatientNextVisit(nextVisit: string | null | undefined): string {
  return nextVisit?.trim() || "None";
}

export function mapPatientToCardData(patient: Patient): PatientCardData {
  return {
    id: patient.id,
    displayName: formatPatientName(patient) || "Unnamed patient",
    isVip: patient.isVip,
    balance: patient.balance,
    currency: patient.currency,
    profilePhoto: patient.profilePhoto,
    nextVisit: null,
  };
}
