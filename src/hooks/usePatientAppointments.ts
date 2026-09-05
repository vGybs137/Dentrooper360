import { Q } from "@nozbe/watermelondb";
import { useEffect, useState } from "react";

import database from "@/database";
import type Appointment from "@/database/models/Appointment";
import type AppointmentType from "@/database/models/AppointmentType";
import { useAuthUser } from "@/stores/authStore";

const APPOINTMENT_COLUMNS = [
  "subject",
  "status",
  "start_time",
  "end_time",
  "type_id",
] as const;

export type PatientAppointmentItem = {
  id: string;
  subject: string;
  status: string;
  startTime: Date;
  endTime: Date;
  typeName: string | null;
  typeColor: string | null;
};

export type UsePatientAppointmentsResult = {
  appointments: PatientAppointmentItem[];
  isLoading: boolean;
  error: Error | null;
};

async function mapAppointment(record: Appointment): Promise<PatientAppointmentItem> {
  let typeName: string | null = null;
  let typeColor: string | null = null;

  if (record.typeId) {
    try {
      const type = await record.type.fetch();
      typeName = type.nameEn?.trim() || null;
      typeColor = type.color ?? null;
    } catch {
      // Type may have been deleted.
    }
  }

  return {
    id: record.id,
    subject: record.subject?.trim() || "Appointment",
    status: record.status,
    startTime: record.startTime,
    endTime: record.endTime,
    typeName,
    typeColor,
  };
}

export function usePatientAppointments(
  patientId: string | undefined,
): UsePatientAppointmentsResult {
  const providerId = useAuthUser()?.id ?? null;
  const [appointments, setAppointments] = useState<PatientAppointmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(patientId && providerId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId || !providerId) {
      setAppointments([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const subscription = database
      .get<Appointment>("appointments")
      .query(
        Q.where("patient_id", patientId),
        Q.where("provider_id", providerId),
        Q.sortBy("start_time", Q.desc),
      )
      .observeWithColumns([...APPOINTMENT_COLUMNS])
      .subscribe({
        next: (records) => {
          void Promise.all(records.map(mapAppointment)).then((mapped) => {
            if (cancelled) {
              return;
            }

            setAppointments(mapped);
            setIsLoading(false);
            setError(null);
          });
        },
        error: (err) => {
          if (cancelled) {
            return;
          }

          setAppointments([]);
          setIsLoading(false);
          setError(err instanceof Error ? err : new Error(String(err)));
        },
      });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [patientId, providerId]);

  return { appointments, isLoading, error };
}

/** Next upcoming appointment start time for hero KPIs. */
export function findNextPatientVisit(
  appointments: readonly PatientAppointmentItem[],
): Date | null {
  const now = Date.now();
  const upcoming = appointments
    .filter((item) => item.startTime.getTime() >= now)
    .sort((left, right) => left.startTime.getTime() - right.startTime.getTime());

  return upcoming[0]?.startTime ?? null;
}
