import { Q } from "@nozbe/watermelondb";
import { useEffect, useState } from "react";

import database from "@/database";
import type Patient from "@/database/models/Patient";

const PATIENT_DETAIL_COLUMNS = [
  "first_name",
  "father_name",
  "last_name",
  "country_code",
  "phone_number",
  "email_address",
  "gender",
  "birth_date",
  "address",
  "balance",
  "currency",
  "is_vip",
  "vip_status_date",
  "referral_source",
  "profile_photo",
  "file_date",
  "is_active",
  "blood_type",
  "title",
] as const;

export type UsePatientDetailsResult = {
  patient: Patient | null;
  isLoading: boolean;
  error: Error | null;
};

export function usePatientDetails(
  patientId: string | undefined,
): UsePatientDetailsResult {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(patientId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId) {
      setPatient(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const subscription = database
      .get<Patient>("patients")
      .query(Q.where("id", patientId))
      .observeWithColumns([...PATIENT_DETAIL_COLUMNS])
      .subscribe({
        next: (records) => {
          if (cancelled) {
            return;
          }

          setPatient(records[0] ?? null);
          setIsLoading(false);
          setError(null);
        },
        error: (err) => {
          if (cancelled) {
            return;
          }

          setPatient(null);
          setIsLoading(false);
          setError(err instanceof Error ? err : new Error(String(err)));
        },
      });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [patientId]);

  return { patient, isLoading, error };
}
