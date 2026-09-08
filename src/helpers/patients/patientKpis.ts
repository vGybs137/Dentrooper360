import dayjs, { type Dayjs } from "dayjs";

import type Patient from "@/database/models/Patient";

export type PatientListKpis = {
  totalPatients: number;
  newThisMonth: number;
  newPatientsMoMGrowth: number | null;
  upcomingVisits: number;
  totalOutstandingBalance: number;
};

export const EMPTY_PATIENT_LIST_KPIS: PatientListKpis = {
  totalPatients: 0,
  newThisMonth: 0,
  newPatientsMoMGrowth: null,
  upcomingVisits: 0,
  totalOutstandingBalance: 0,
};

function isInMonth(date: Date | null | undefined, month: Dayjs): boolean {
  if (!date || Number.isNaN(date.getTime())) {
    return false;
  }

  const value = dayjs(date);
  return value.year() === month.year() && value.month() === month.month();
}

export function countNewPatientsInMonth(
  patients: Pick<Patient, "fileDate">[],
  month: Dayjs,
): number {
  return patients.filter((patient) => isInMonth(patient.fileDate, month)).length;
}

/** Rounded percent change; null when previous month had zero new patients. */
export function computeMonthOverMonthGrowth(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }

  return Math.round(((current - previous) / previous) * 100);
}

export function sumOutstandingBalance(
  patients: Pick<Patient, "balance">[],
): number {
  return patients.reduce((sum, patient) => {
    const balance = patient.balance ?? 0;
    return balance > 0 ? sum + balance : sum;
  }, 0);
}

export function computePatientListKpis(
  patients: Patient[],
  upcomingAppointmentCount: number,
  referenceDate: Dayjs = dayjs(),
): PatientListKpis {
  const thisMonth = referenceDate.startOf("month");
  const lastMonth = referenceDate.subtract(1, "month").startOf("month");
  const newThisMonth = countNewPatientsInMonth(patients, thisMonth);
  const newLastMonth = countNewPatientsInMonth(patients, lastMonth);

  return {
    totalPatients: patients.length,
    newThisMonth,
    newPatientsMoMGrowth: computeMonthOverMonthGrowth(
      newThisMonth,
      newLastMonth,
    ),
    upcomingVisits: upcomingAppointmentCount,
    totalOutstandingBalance: sumOutstandingBalance(patients),
  };
}
