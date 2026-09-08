import { useEffect, useMemo, useState } from "react";
import { Q } from "@nozbe/watermelondb";

import database from "@/database";
import type ProviderWorkingHours from "@/database/models/ProviderWorkingHours";
import {
  buildHoursByWeekday,
  hoursForDayKey as resolveHoursForDayKey,
  hoursForWeekday as resolveHoursForWeekday,
  scheduleHoursEnvelope,
  type ScheduleHourRange,
} from "@/helpers/schedule/scheduleHours";
import { useAuthUser } from "@/stores/authStore";
import type { DayKey, WeekdayIndex } from "@/helpers/schedule/calendar";

export type UserScheduleHours = ScheduleHourRange;

export type UseUserScheduleHoursResult = {
  /** Per-weekday ranges from `provider_working_hours` (0 = Sunday). */
  hoursByWeekday: Partial<Record<WeekdayIndex, ScheduleHourRange>>;
  /** True when the provider has at least one working-hours row. */
  hasConfiguredHours: boolean;
  /** Union window across open weekdays (week gutter / shared Y-axis). */
  envelope: ScheduleHourRange;
  /** Convenience: same as `envelope` for callers that still expect a single range. */
  startHour: number;
  endHour: number;
  error: Error | null;
  hoursForWeekday: (weekday: WeekdayIndex) => ScheduleHourRange | null;
  hoursForDayKey: (dayKey: DayKey) => ScheduleHourRange | null;
};

/** Working hours from synced `provider_working_hours`, keyed by weekday. */
export function useUserScheduleHours(): UseUserScheduleHoursResult {
  const user = useAuthUser();
  const [rows, setRows] = useState<ProviderWorkingHours[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setRows([]);
      setError(null);
      return;
    }

    const collection = database.collections.get<ProviderWorkingHours>(
      "provider_working_hours",
    );
    const query = collection.query(Q.where("provider_id", user.id));
    const subscription = query.observe().subscribe({
      next: (nextRows) => {
        setRows(nextRows);
        setError(null);
      },
      error: (err) => {
        setRows([]);
        setError(err instanceof Error ? err : new Error(String(err)));
      },
    });
    return () => subscription.unsubscribe();
  }, [user?.id]);

  return useMemo(() => {
    const hoursByWeekday = buildHoursByWeekday(rows);
    const hasConfiguredHours = Object.keys(hoursByWeekday).length > 0;
    const envelope = scheduleHoursEnvelope(hoursByWeekday);

    return {
      hoursByWeekday,
      hasConfiguredHours,
      envelope,
      startHour: envelope.startHour,
      endHour: envelope.endHour,
      error,
      hoursForWeekday: (weekday: WeekdayIndex) =>
        resolveHoursForWeekday(hoursByWeekday, weekday, hasConfiguredHours),
      hoursForDayKey: (dayKey: DayKey) =>
        resolveHoursForDayKey(hoursByWeekday, dayKey, hasConfiguredHours),
    };
  }, [error, rows]);
}
