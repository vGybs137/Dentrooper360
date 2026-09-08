import database from "@/database";
import type Patient from "@/database/models/Patient";
import { useObservedRecord } from "@/hooks/data/useObservedQuery";

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

export { snapshotPatient };

export type UsePatientDetailsResult = {
  patient: PatientDetailsData | null;
  isLoading: boolean;
  error: Error | null;
};

export function usePatientDetails(
  patientId: string | undefined,
): UsePatientDetailsResult {
  const { data, isLoading, error } = useObservedRecord({
    enabled: Boolean(patientId),
    deps: [patientId],
    getObserve: () =>
      database.get<Patient>("patients").findAndObserve(patientId!),
    map: snapshotPatient,
  });

  return { patient: data, isLoading, error };
}
