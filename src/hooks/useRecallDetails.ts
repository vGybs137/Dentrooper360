import { useEffect, useState } from "react";

import database from "@/database";
import type Appointment from "@/database/models/Appointment";
import type Patient from "@/database/models/Patient";
import type Recall from "@/database/models/Recall";
import {
  formatPatientName,
  type PatientCardData,
} from "@/helpers/patientDisplay";
import {
  snapshotPatient,
  type PatientDetailsData,
} from "@/hooks/usePatientDetails";

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

export function useRecallDetails(
  recallId: string | undefined,
): UseRecallDetailsResult {
  const [recall, setRecall] = useState<RecallDetailsData | null>(null);
  const [patient, setPatient] = useState<PatientDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(recallId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!recallId) {
      setRecall(null);
      setPatient(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const subscription = database
      .get<Recall>("recalls")
      .findAndObserve(recallId)
      .subscribe({
        next: (record) => {
          void (async () => {
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

            if (cancelled) {
              return;
            }

            setRecall(snapshotRecall(record, appointment));
            setPatient(patientRecord ? snapshotPatient(patientRecord) : null);
            setIsLoading(false);
            setError(null);
          })();
        },
        error: (err) => {
          if (cancelled) {
            return;
          }

          setRecall(null);
          setPatient(null);
          setIsLoading(false);
          setError(err instanceof Error ? err : new Error(String(err)));
        },
      });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [recallId]);

  return { recall, patient, isLoading, error };
}
