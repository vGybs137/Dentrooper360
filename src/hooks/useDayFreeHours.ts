import { Q } from "@nozbe/watermelondb";
import { useEffect, useMemo, useState } from "react";

import database from "@/database";
import type Appointment from "@/database/models/Appointment";
import {
  computeDayFreeIntervals,
  formatDayFreeHourLabels,
  selectionOverlapsBusyIntervals,
  type DayBusyInterval,
} from "@/helpers/dayFreeHours";
import { useUserScheduleHours } from "@/hooks/schedule/useUserScheduleHours";
import { useAuthUser } from "@/stores";
import { useHourFormat } from "@/stores/schedulePreferencesStore";
import { parseDayKey, toDayKey, toLocalDate } from "@/utils/calendar";

type UseDayFreeHoursOptions = {
  enabled?: boolean;
  excludeAppointmentId?: string | null;
  selectionStart?: Date | null;
  selectionEnd?: Date | null;
};

export function useDayFreeHours(
  date: Date,
  {
    enabled = true,
    excludeAppointmentId = null,
    selectionStart = null,
    selectionEnd = null,
  }: UseDayFreeHoursOptions = {},
) {
  const user = useAuthUser();
  const hourFormat = useHourFormat();
  const { startHour, endHour } = useUserScheduleHours();
  const [events, setEvents] = useState<DayBusyInterval[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);

  const dayKey = useMemo(() => toDayKey(date), [date]);
  const dayStartMs = useMemo(
    () => toLocalDate(parseDayKey(dayKey)).getTime(),
    [dayKey],
  );
  const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000;
  const providerId = user?.id ?? null;

  useEffect(() => {
    if (!enabled || !providerId) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const subscription = database
      .get<Appointment>("appointments")
      .query(
        Q.where("provider_id", providerId),
        Q.where("start_time", Q.gte(dayStartMs)),
        Q.where("start_time", Q.lt(dayEndMs)),
      )
      .observeWithColumns(["start_time", "end_time"])
      .subscribe({
        next: (records) => {
          setEvents(
            records
              .filter((record) => record.id !== excludeAppointmentId)
              .map((record) => ({
                startTime: record.startTime.getTime(),
                endTime: record.endTime.getTime(),
              })),
          );
          setIsLoading(false);
        },
        error: () => {
          setEvents([]);
          setIsLoading(false);
        },
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [dayEndMs, dayStartMs, enabled, excludeAppointmentId, providerId]);

  const freeIntervals = useMemo(
    () => computeDayFreeIntervals(events, startHour, endHour, dayStartMs),
    [dayStartMs, endHour, events, startHour],
  );

  const labels = useMemo(() => {
    if (isLoading) {
      return ["Loading free hours..."];
    }

    if (freeIntervals.length === 0) {
      return ["No free time in your working hours."];
    }

    return formatDayFreeHourLabels(freeIntervals, dayStartMs, hourFormat);
  }, [freeIntervals, hourFormat, isLoading, dayStartMs]);

  const overlapsSelection = useMemo(() => {
    if (!selectionStart || !selectionEnd) {
      return false;
    }

    return selectionOverlapsBusyIntervals(
      selectionStart.getTime(),
      selectionEnd.getTime(),
      events,
    );
  }, [events, selectionEnd, selectionStart]);

  return {
    labels,
    isLoading,
    freeIntervals,
    overlapsSelection,
  };
}
