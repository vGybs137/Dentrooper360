import { Q } from "@nozbe/watermelondb";
import { useEffect, useMemo, useState } from "react";

import database from "@/database";
import type Appointment from "@/database/models/Appointment";
import type Patient from "@/database/models/Patient";
import {
  formatNextVisitLabel,
  mapPatientToCardData,
  type PatientCardData,
} from "@/helpers/patientDisplay";
import { useAuthUser } from "@/stores/authStore";

function matchesPatientSearch(
  patient: PatientCardData,
  search: string,
): boolean {
  const query = search.trim().toLowerCase();
  if (!query) {
    return true;
  }

  return patient.displayName.toLowerCase().includes(query);
}

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

function mapPatientsWithNextVisit(
  records: Patient[],
  nextByPatient: Map<string, Date>,
): PatientCardData[] {
  return records
    .map((patient) =>
      mapPatientToCardData(
        patient,
        formatNextVisitLabel(nextByPatient.get(patient.id) ?? null),
      ),
    )
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

type UseActivePatientsOptions = {
  /** When false, skip Watermelon observe (e.g. sheet closed). */
  enabled?: boolean;
};

/** Active patients from WatermelonDB, sorted by display name, optionally filtered. */
export function useActivePatients(
  search = "",
  { enabled = true }: UseActivePatientsOptions = {},
) {
  const providerId = useAuthUser()?.id ?? null;
  const [patients, setPatients] = useState<PatientCardData[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    if (!providerId) {
      setPatients([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);

    let patientRecords: Patient[] = [];
    let nextByPatient = new Map<string, Date>();
    let patientsReady = false;
    let appointmentsReady = false;

    const publish = () => {
      if (!patientsReady || !appointmentsReady) {
        return;
      }

      setPatients(mapPatientsWithNextVisit(patientRecords, nextByPatient));
      setIsLoading(false);
      setError(null);
    };

    const patientsQuery = database
      .get<Patient>("patients")
      .query(Q.where("is_active", true));

    const appointmentsQuery = database
      .get<Appointment>("appointments")
      .query(
        Q.where("provider_id", providerId),
        Q.where("start_time", Q.gte(Date.now())),
      );

    const patientsSub = patientsQuery.observe().subscribe({
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

    const appointmentsSub = appointmentsQuery.observe().subscribe({
      next: (records) => {
        nextByPatient = buildNextVisitByPatient(records);
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
  }, [enabled, providerId]);

  const filteredPatients = useMemo(
    () => patients.filter((patient) => matchesPatientSearch(patient, search)),
    [patients, search],
  );

  return {
    patients: filteredPatients,
    allPatients: patients,
    isLoading,
    error,
  };
}
