import database from "@/database";
import type Appointment from "@/database/models/Appointment";
import type Patient from "@/database/models/Patient";
import type Recall from "@/database/models/Recall";
import {
  formatPatientName,
  type PatientCardData,
} from "@/helpers/patients/patientDisplay";
import {
  snapshotPatient,
  type PatientDetailsData,
} from "@/hooks/patients/usePatientDetails";
import { useObservedRecord } from "@/hooks/data/useObservedQuery";

export type RecallDetailsData = {
  id: string;
  patientId: string;
  appointmentId: string | null;
  serviceCode: string | null;
  serviceName: string;
  interval: number;
  reminderInterval: number;
  date: Date;
  dueDate: Date;
  note: string | null;
  isActive: boolean;
  appointmentStartTime: Date | null;
  appointmentEndTime: Date | null;
  appointmentSubject: string | null;
  appointmentStatus: string | null;
};

export type UseRecallDetailsResult = {
  recall: RecallDetailsData | null;
  patient: PatientDetailsData | null;
  isLoading: boolean;
  error: Error | null;
};

type RecallDetailsBundle = {
  recall: RecallDetailsData;
  patient: PatientDetailsData | null;
};

function snapshotRecall(
  record: Recall,
  appointment: Appointment | null,
): RecallDetailsData {
  const rawPatientId = (record._raw as { patient_id?: string }).patient_id;

  return {
    id: record.id,
    patientId: rawPatientId ?? "",
    appointmentId: record.appointmentId?.trim() || null,
    serviceCode: record.serviceCode,
    serviceName: record.serviceNameEn?.trim() || "Service",
    interval: record.interval,
    reminderInterval: record.reminderInterval,
    date: record.date,
    dueDate: record.dueDate,
    note: record.note?.trim() || null,
    isActive: record.isActive,
    appointmentStartTime: appointment?.startTime ?? null,
    appointmentEndTime: appointment?.endTime ?? null,
    appointmentSubject: appointment?.subject?.trim() || null,
    appointmentStatus: appointment?.status?.trim() || null,
  };
}

export function toAppointmentPatientDraft(
  patient: PatientDetailsData,
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
    nextVisit: null,
  };
}

async function mapRecallRecord(record: Recall): Promise<RecallDetailsBundle> {
  let appointment: Appointment | null = null;
  let patientRecord: Patient | null = null;

  try {
    patientRecord = await record.patient.fetch();
  } catch {
    patientRecord = null;
  }

  if (record.appointmentId?.trim()) {
    try {
      appointment = await record.appointment.fetch();
    } catch {
      appointment = null;
    }
  }

  return {
    recall: snapshotRecall(record, appointment),
    patient: patientRecord ? snapshotPatient(patientRecord) : null,
  };
}

export function useRecallDetails(
  recallId: string | undefined,
): UseRecallDetailsResult {
  const { data, isLoading, error } = useObservedRecord({
    enabled: Boolean(recallId),
    deps: [recallId],
    getObserve: () =>
      database.get<Recall>("recalls").findAndObserve(recallId!),
    map: mapRecallRecord,
  });

  return {
    recall: data?.recall ?? null,
    patient: data?.patient ?? null,
    isLoading,
    error,
  };
}
