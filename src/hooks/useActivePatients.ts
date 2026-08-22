import { Q } from "@nozbe/watermelondb";
import { useEffect, useMemo, useState } from "react";

import database from "@/database";
import type Patient from "@/database/models/Patient";
import {
  mapPatientToCardData,
  type PatientCardData,
} from "@/helpers/patientDisplay";

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

/** Active patients from WatermelonDB, sorted by display name, optionally filtered. */
export function useActivePatients(search = "") {
  const [patients, setPatients] = useState<PatientCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const query = database
      .get<Patient>("patients")
      .query(Q.where("is_active", true));

    const subscription = query.observe().subscribe({
      next: (records) => {
        setPatients(
          records
            .map(mapPatientToCardData)
            .sort((a, b) => a.displayName.localeCompare(b.displayName)),
        );
        setIsLoading(false);
        setError(null);
      },
      error: (err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, []);

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
