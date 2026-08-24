import { Q } from "@nozbe/watermelondb";
import { useEffect, useMemo, useState } from "react";

import database from "@/database";
import type Appointment from "@/database/models/Appointment";
import type AppointmentType from "@/database/models/AppointmentType";
import type { MonthDayEventPreview } from "@/types/schedule";

function matchesSubjectSearch(subject: string, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return false;
  }

  return subject.trim().toLowerCase().includes(normalizedQuery);
}

function toPreview(
  appointment: Appointment,
  types: Map<string, { color: string | null; name: string }>,
): MonthDayEventPreview {
  const type = appointment.typeId ? types.get(appointment.typeId) : undefined;

  return {
    id: appointment.id,
    title: appointment.subject?.trim() || "Appointment",
    color: type?.color ?? null,
    typeName: type?.name ?? null,
    startTime: appointment.startTime.getTime(),
    endTime: appointment.endTime.getTime(),
  };
}

export type UseAppointmentSearchResult = {
  results: MonthDayEventPreview[];
  isLoading: boolean;
  error: Error | null;
};

/** Live appointment search filtered by subject (case-insensitive substring). */
export function useAppointmentSearch(query: string): UseAppointmentSearchResult {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [types, setTypes] = useState(
    new Map<string, { color: string | null; name: string }>(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const appointmentsSubscription = database
      .get<Appointment>("appointments")
      .query(Q.sortBy("start_time", Q.desc))
      .observeWithColumns([
        "patient_id",
        "type_id",
        "location_id",
        "subject",
        "status",
        "description",
        "start_time",
        "end_time",
      ])
      .subscribe({
        next: (records) => {
          setAppointments(records);
          setIsLoading(false);
        },
        error: (err) => {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        },
      });

    const typesSubscription = database
      .get<AppointmentType>("appointment_types")
      .query()
      .observe()
      .subscribe({
        next: (records) => {
          const next = new Map<string, { color: string | null; name: string }>();
          for (const type of records) {
            next.set(type.id, {
              color: type.color ?? null,
              name: type.nameEn?.trim() || type.nameAr?.trim() || "",
            });
          }
          setTypes(next);
        },
      });

    return () => {
      appointmentsSubscription.unsubscribe();
      typesSubscription.unsubscribe();
    };
  }, []);

  const results = useMemo(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return [];
    }

    return appointments
      .filter((appointment) =>
        matchesSubjectSearch(appointment.subject ?? "", trimmedQuery),
      )
      .map((appointment) => toPreview(appointment, types));
  }, [appointments, query, types]);

  return { results, isLoading, error };
}
