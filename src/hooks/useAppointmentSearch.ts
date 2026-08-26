import { Q } from "@nozbe/watermelondb";
import { useEffect, useMemo, useState } from "react";

import {
  DEFAULT_APPOINTMENT_SEARCH_TIME_WINDOW,
  resolveAppointmentSearchTimeRange,
  type AppointmentSearchTimeWindow,
} from "@/constants/appointmentSearch";
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

export type AppointmentSearchTypeOption = {
  id: string;
  name: string;
  color: string | null;
};

export type UseAppointmentSearchResult = {
  results: MonthDayEventPreview[];
  typeOptions: AppointmentSearchTypeOption[];
  isLoading: boolean;
  error: Error | null;
};

/** Live appointment search filtered by subject, types, and optional time window. */
export function useAppointmentSearch(
  query: string,
  selectedTypeIds: readonly string[] = [],
  timeWindow: AppointmentSearchTimeWindow = DEFAULT_APPOINTMENT_SEARCH_TIME_WINDOW,
): UseAppointmentSearchResult {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [types, setTypes] = useState(
    new Map<string, { color: string | null; name: string }>(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const timeRange = useMemo(
    () => resolveAppointmentSearchTimeRange(timeWindow),
    [timeWindow],
  );
  const rangeStartMs = timeRange?.startMs ?? null;
  const rangeEndMs = timeRange?.endMs ?? null;

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const appointmentsQuery =
      rangeStartMs != null && rangeEndMs != null
        ? database
            .get<Appointment>("appointments")
            .query(
              Q.where("start_time", Q.gte(rangeStartMs)),
              Q.where("start_time", Q.lt(rangeEndMs)),
              Q.sortBy("start_time", Q.desc),
            )
        : database
            .get<Appointment>("appointments")
            .query(Q.sortBy("start_time", Q.desc));

    const appointmentsSubscription = appointmentsQuery
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
  }, [rangeEndMs, rangeStartMs]);

  const typeOptions = useMemo<AppointmentSearchTypeOption[]>(
    () =>
      Array.from(types.entries())
        .map(([id, type]) => ({
          id,
          name: type.name,
          color: type.color,
        }))
        .filter((type) => type.name.length > 0)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [types],
  );

  const results = useMemo(() => {
    const trimmedQuery = query.trim();
    const hasQuery = trimmedQuery.length > 0;
    const hasTypeFilter = selectedTypeIds.length > 0;

    if (!hasQuery && !hasTypeFilter) {
      return [];
    }

    const selectedTypeIdSet = new Set(selectedTypeIds);

    return appointments
      .filter((appointment) => {
        if (
          hasTypeFilter &&
          (!appointment.typeId || !selectedTypeIdSet.has(appointment.typeId))
        ) {
          return false;
        }

        if (hasQuery && !matchesSubjectSearch(appointment.subject ?? "", trimmedQuery)) {
          return false;
        }

        return true;
      })
      .map((appointment) => toPreview(appointment, types));
  }, [appointments, query, selectedTypeIds, types]);

  return { results, typeOptions, isLoading, error };
}
