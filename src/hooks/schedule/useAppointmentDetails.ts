import { Q } from "@nozbe/watermelondb";

import database from "@/database";
import type Appointment from "@/database/models/Appointment";
import type AppointmentType from "@/database/models/AppointmentType";
import type Location from "@/database/models/Location";
import type Patient from "@/database/models/Patient";
import { useObservedQuery } from "@/hooks/data/useObservedQuery";
import { useAuthUser } from "@/stores/authStore";

/** Columns that should refresh appointment details when changed. */
const APPOINTMENT_DETAIL_COLUMNS = [
  "patient_id",
  "type_id",
  "location_id",
  "subject",
  "status",
  "description",
  "start_time",
  "end_time",
] as const;

export type AppointmentDetails = {
  appointment: Appointment;
  patient: Patient | null;
  type: AppointmentType | null;
  location: Location | null;
};

export type UseAppointmentDetailsResult = {
  details: AppointmentDetails | null;
  isLoading: boolean;
  error: Error | null;
};

async function fetchRelation<T>(
  id: string | null,
  fetch: () => Promise<T>,
): Promise<T | null> {
  if (!id) {
    return null;
  }

  try {
    return await fetch();
  } catch {
    return null;
  }
}

async function mapAppointmentRecords(
  records: Appointment[],
): Promise<AppointmentDetails | null> {
  const appointment = records[0];
  if (!appointment) {
    return null;
  }

  const [patient, type, location] = await Promise.all([
    fetchRelation(appointment.patientId, () => appointment.patient.fetch()),
    fetchRelation(appointment.typeId, () => appointment.type.fetch()),
    fetchRelation(appointment.locationId, () => appointment.location.fetch()),
  ]);

  return { appointment, patient, type, location };
}

export function useAppointmentDetails(
  appointmentId: string | undefined,
): UseAppointmentDetailsResult {
  const providerId = useAuthUser()?.id ?? null;
  const enabled = Boolean(appointmentId && providerId);

  const { data, isLoading, error } = useObservedQuery<
    Appointment,
    AppointmentDetails | null
  >({
    enabled,
    deps: [appointmentId, providerId],
    columns: APPOINTMENT_DETAIL_COLUMNS,
    emptyData: null,
    getQuery: () =>
      database.get<Appointment>("appointments").query(
        Q.where("id", appointmentId!),
        Q.where("provider_id", providerId!),
      ),
    mapRecords: mapAppointmentRecords,
  });

  return { details: data, isLoading, error };
}
