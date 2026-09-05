import { useEffect, useState } from "react";

import database from "@/database";
import type Patient from "@/database/models/Patient";

/** Plain snapshot so React/Compiler re-render when Watermelon mutates the same Model. */
export type PatientDetailsData = {
  id: string;
  firstName: string | null;
  fatherName: string | null;
  lastName: string | null;
  countryCode: string | null;
  phoneNumber: string | null;
  emailAddress: string | null;
  gender: string | null;
  birthDate: Date | null;
  address: string | null;
  balance: number;
  currency: string | null;
  isVip: boolean;
  referralSource: string | null;
  profilePhoto: string | null;
  fileDate: Date | null;
  isActive: boolean;
};

function snapshotPatient(record: Patient): PatientDetailsData {
  return {
    id: record.id,
    firstName: record.firstName,
    fatherName: record.fatherName,
    lastName: record.lastName,
    countryCode: record.countryCode,
    phoneNumber: record.phoneNumber,
    emailAddress: record.emailAddress,
    gender: record.gender,
    birthDate: record.birthDate,
    address: record.address,
    balance: record.balance,
    currency: record.currency,
    isVip: record.isVip,
    referralSource: record.referralSource,
    profilePhoto: record.profilePhoto,
    fileDate: record.fileDate,
    isActive: record.isActive,
  };
}

export type UsePatientDetailsResult = {
  patient: PatientDetailsData | null;
  isLoading: boolean;
  error: Error | null;
};

export function usePatientDetails(
  patientId: string | undefined,
): UsePatientDetailsResult {
  const [patient, setPatient] = useState<PatientDetailsData | null>(null);
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

    // findAndObserve re-emits on any field change to this record (unlike query.observe()).
    const subscription = database
      .get<Patient>("patients")
      .findAndObserve(patientId)
      .subscribe({
        next: (record) => {
          if (cancelled) {
            return;
          }

          // Always allocate a new plain object — Model identity is stable across edits
          // and React Compiler skips children when the same reference is passed.
          setPatient(snapshotPatient(record));
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
