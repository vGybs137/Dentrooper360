import { Q } from "@nozbe/watermelondb";
import { useEffect, useMemo, useState } from "react";

import database from "@/database";
import type Appointment from "@/database/models/Appointment";
import type Patient from "@/database/models/Patient";
import {
  formatNextVisitLabel,
  mapPatientToCardData,
  patientMatchesSearch,
  type PatientCardData,
} from "@/helpers/patients/patientDisplay";
import {
  computePatientListKpis,
  EMPTY_PATIENT_LIST_KPIS,
  type PatientListKpis,
} from "@/helpers/patients/patientKpis";

export type PatientSort = "name" | "fileDate";

/** Columns that should refresh the patients list when changed. */
const PATIENT_LIST_COLUMNS = [
  "first_name",
  "father_name",
  "last_name",
  "country_code",
  "phone_number",
  "is_vip",
  "balance",
  "currency",
  "profile_photo",
  "file_date",
  "is_active",
] as const;

const UPCOMING_APPOINTMENT_COLUMNS = ["patient_id", "start_time"] as const;

/** Earliest upcoming start time per patient id. */
function buildNextVisitByPatient(
  appointments: Appointment[],
): Map<string, Date> {
  const nextByPatient = new Map<string, Date>();

  for (const appointment of appointments) {
    const patientId = appointment.patientId;
    if (!patientId) {
      continue;
    }

    const existing = nextByPatient.get(patientId);
    if (!existing || appointment.startTime < existing) {
      nextByPatient.set(patientId, appointment.startTime);
    }
  }

  return nextByPatient;
}

function comparePatients(a: PatientCardData, b: PatientCardData): number {
  const aTime = a.fileDate?.getTime() ?? Number.NEGATIVE_INFINITY;
  const bTime = b.fileDate?.getTime() ?? Number.NEGATIVE_INFINITY;

  if (aTime !== bTime) {
    return bTime - aTime;
  }

  return a.displayName.localeCompare(b.displayName);
}

function sortPatients(
  patients: PatientCardData[],
  sortBy: PatientSort,
): PatientCardData[] {
  if (sortBy === "fileDate") {
    return [...patients].sort(comparePatients);
  }

  return [...patients].sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function mapPatientsWithNextVisit(
  records: Patient[],
  nextByPatient: Map<string, Date>,
  sortBy: PatientSort,
): PatientCardData[] {
  return sortPatients(
    records.map((patient) =>
      mapPatientToCardData(
        patient,
        formatNextVisitLabel(nextByPatient.get(patient.id) ?? null),
      ),
    ),
    sortBy,
  );
}

type UseActivePatientsOptions = {
  /** When false, skip Watermelon observe (e.g. sheet closed). */
  enabled?: boolean;
  sortBy?: PatientSort;
};

/** Active patients from WatermelonDB, optionally filtered and sorted. */
export function useActivePatients(
  search = "",
  { enabled = true, sortBy = "name" }: UseActivePatientsOptions = {},
) {
  const [patients, setPatients] = useState<PatientCardData[]>([]);
  const [kpis, setKpis] = useState<PatientListKpis>(EMPTY_PATIENT_LIST_KPIS);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      setKpis(EMPTY_PATIENT_LIST_KPIS);
      return;
    }

    setIsLoading(true);

    let patientRecords: Patient[] = [];
    let nextByPatient = new Map<string, Date>();
    let upcomingAppointmentCount = 0;
    let patientsReady = false;
    let appointmentsReady = false;

    const publish = () => {
      if (!patientsReady || !appointmentsReady) {
        return;
      }

      setPatients(mapPatientsWithNextVisit(patientRecords, nextByPatient, sortBy));
      setKpis(
        computePatientListKpis(patientRecords, upcomingAppointmentCount),
      );
      setIsLoading(false);
      setError(null);
    };

    const patientsQuery = database
      .get<Patient>("patients")
      .query(Q.where("is_active", true));

    const appointmentsQuery = database
      .get<Appointment>("appointments")
      .query(Q.where("start_time", Q.gte(Date.now())));

    const patientsSub = patientsQuery
      .observeWithColumns([...PATIENT_LIST_COLUMNS])
      .subscribe({
      next: (records) => {
        patientRecords = records;
        patientsReady = true;
        publish();
      },
      error: (err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      },
    });

    const appointmentsSub = appointmentsQuery
      .observeWithColumns([...UPCOMING_APPOINTMENT_COLUMNS])
      .subscribe({
      next: (records) => {
        nextByPatient = buildNextVisitByPatient(records);
        upcomingAppointmentCount = records.length;
        appointmentsReady = true;
        publish();
      },
      error: (err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      },
    });

    return () => {
      patientsSub.unsubscribe();
      appointmentsSub.unsubscribe();
    };
  }, [enabled, sortBy]);

  const filteredPatients = useMemo(
    () => patients.filter((patient) => patientMatchesSearch(patient, search)),
    [patients, search],
  );

  return {
    patients: filteredPatients,
    allPatients: patients,
    kpis,
    isLoading,
    error,
  };
}
