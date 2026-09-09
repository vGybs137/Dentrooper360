import { Q } from "@nozbe/watermelondb";
import { useDatabase } from "@nozbe/watermelondb/react";

import type Appointment from "@/database/models/Appointment";
import { useObservedQuery } from "@/hooks/data/useObservedQuery";
import { useAuthUser } from "@/stores/authStore";

const APPOINTMENT_COLUMNS = [
  "subject",
  "status",
  "start_time",
  "end_time",
  "type_id",
] as const;

const EMPTY_APPOINTMENTS: PatientAppointmentItem[] = [];

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

async function mapAppointment(
  record: Appointment,
): Promise<PatientAppointmentItem> {
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
  const database = useDatabase();
  const providerId = useAuthUser()?.id ?? null;
  const enabled = Boolean(patientId && providerId);

  const { data, isLoading, error } = useObservedQuery<
    Appointment,
    PatientAppointmentItem[]
  >({
    enabled,
    deps: [patientId, providerId],
    columns: APPOINTMENT_COLUMNS,
    emptyData: EMPTY_APPOINTMENTS,
    getQuery: () =>
      database.get<Appointment>("appointments").query(
        Q.where("patient_id", patientId!),
        Q.where("provider_id", providerId!),
        Q.sortBy("start_time", Q.desc),
      ),
    mapRecords: (records) => Promise.all(records.map(mapAppointment)),
  });

  return { appointments: data, isLoading, error };
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
