import dayjs from "dayjs";

import type Patient from "@/database/models/Patient";
import { dayjsDateTimePattern } from "@/helpers/timeFormat";
import type { HourFormat } from "@/stores/schedulePreferencesStore";
import { useSchedulePreferencesStore } from "@/stores/schedulePreferencesStore";

export type PatientCardData = {
  id: string;
  displayName: string;
  countryCode: string | null;
  phoneNumber: string | null;
  isVip: boolean;
  balance: number | null;
  currency: string | null;
  profilePhoto: string | null;
  fileDate: Date | null;
  nextVisit: string | null;
};

export function formatPatientName(
  patient: Pick<Patient, "firstName" | "fatherName" | "lastName">,
): string {
  return [patient.firstName, patient.fatherName, patient.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
}

export function formatPatientPhone(
  countryCode: string | null | undefined,
  phoneNumber: string | null | undefined,
): string | null {
  const parts = [countryCode?.trim(), phoneNumber?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}

function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

type PatientSearchFields = Pick<
  PatientCardData,
  "displayName" | "countryCode" | "phoneNumber"
>;

/** Match patient display name or phone (formatted or digits-only). */
export function patientMatchesSearch(
  patient: PatientSearchFields,
  search: string,
): boolean {
  const query = search.trim();
  if (!query) {
    return true;
  }

  const lowerQuery = query.toLowerCase();
  if (patient.displayName.toLowerCase().includes(lowerQuery)) {
    return true;
  }

  const formattedPhone = formatPatientPhone(
    patient.countryCode,
    patient.phoneNumber,
  );
  if (formattedPhone?.toLowerCase().includes(lowerQuery)) {
    return true;
  }

  const queryDigits = phoneDigits(query);
  if (queryDigits.length === 0) {
    return false;
  }

  const patientDigits = phoneDigits(
    [patient.countryCode, patient.phoneNumber].filter(Boolean).join(""),
  );
  return patientDigits.includes(queryDigits);
}

export function formatPatientBalance(
  balance: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (balance == null || balance === 0) {
    return "---";
  }

  const prefix = currency ?? "$";
  return `${prefix} ${Math.abs(balance).toFixed(2)}`;
}

export function formatPatientNextVisit(
  nextVisit: string | null | undefined,
): string {
  return nextVisit?.trim() || "None";
}

/** Compact label for patient cards, e.g. "23 Aug, 2:00 PM". */
export function formatNextVisitLabel(
  date: Date | null | undefined,
  hourFormat?: HourFormat,
): string | null {
  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }

  const format =
    hourFormat ?? useSchedulePreferencesStore.getState().hourFormat;
  return dayjs(date).format(dayjsDateTimePattern(format));
}

export function mapPatientToCardData(
  patient: Patient,
  nextVisit: string | null = null,
): PatientCardData {
  return {
    id: patient.id,
    displayName: formatPatientName(patient) || "Unnamed patient",
    countryCode: patient.countryCode?.trim() || null,
    phoneNumber: patient.phoneNumber?.trim() || null,
    isVip: patient.isVip,
    balance: patient.balance,
    currency: patient.currency,
    profilePhoto: patient.profilePhoto,
    fileDate: patient.fileDate,
    nextVisit,
  };
}
