import { Q } from "@nozbe/watermelondb";
import { useEffect, useState } from "react";

import database from "@/database";
import type Appointment from "@/database/models/Appointment";
import type AppointmentType from "@/database/models/AppointmentType";
import type Location from "@/database/models/Location";
import type Patient from "@/database/models/Patient";
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

export function useAppointmentDetails(
  appointmentId: string | undefined,
): UseAppointmentDetailsResult {
  const providerId = useAuthUser()?.id ?? null;
  const [details, setDetails] = useState<AppointmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(appointmentId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!appointmentId || !providerId) {
      setDetails(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    // observe() only emits when records enter/leave the query. Field updates
    // require observeWithColumns so edits refresh this screen without reload.
    const subscription = database
      .get<Appointment>("appointments")
      .query(
        Q.where("id", appointmentId),
        Q.where("provider_id", providerId),
      )
      .observeWithColumns([...APPOINTMENT_DETAIL_COLUMNS])
      .subscribe({
        next: (records) => {
          const appointment = records[0];
          if (!appointment) {
            if (!cancelled) {
              setDetails(null);
              setIsLoading(false);
              setError(null);
            }
            return;
          }

          void Promise.all([
            fetchRelation(appointment.patientId, () =>
              appointment.patient.fetch(),
            ),
            fetchRelation(appointment.typeId, () => appointment.type.fetch()),
            fetchRelation(appointment.locationId, () =>
              appointment.location.fetch(),
            ),
          ]).then(([patient, type, location]) => {
            if (cancelled) {
              return;
            }

            setDetails({ appointment, patient, type, location });
            setIsLoading(false);
            setError(null);
          });
        },
        error: (err) => {
          if (cancelled) {
            return;
          }

          setDetails(null);
          setIsLoading(false);
          setError(err instanceof Error ? err : new Error(String(err)));
        },
      });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [appointmentId, providerId]);

  return { details, isLoading, error };
}
