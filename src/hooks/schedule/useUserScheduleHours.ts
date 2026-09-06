import { useEffect, useMemo, useState } from "react";
import { Q } from "@nozbe/watermelondb";

import {
  WEEK_VIEW_DEFAULT_END_HOUR,
  WEEK_VIEW_DEFAULT_START_HOUR,
} from "@/constants/schedule";
import database from "@/database";
import type ProviderWorkingHours from "@/database/models/ProviderWorkingHours";
import {
  normalizeScheduleHourRange,
  parseScheduleHour,
} from "@/helpers/scheduleHours";
import { useAuthUser } from "@/stores/authStore";

export type UserScheduleHours = {
  startHour: number;
  endHour: number;
};

/** Earliest start / latest end from synced provider_working_hours, with schedule defaults as fallback. */
export function useUserScheduleHours(): UserScheduleHours {
  const user = useAuthUser();
  const [rows, setRows] = useState<ProviderWorkingHours[]>([]);

  useEffect(() => {
    if (!user?.id) {
      setRows([]);
      return;
    }

    const collection = database.collections.get<ProviderWorkingHours>(
      "provider_working_hours",
    );
    const query = collection.query(Q.where("provider_id", user.id));
    const subscription = query.observe().subscribe(setRows);
    return () => subscription.unsubscribe();
  }, [user?.id]);

  return useMemo(() => {
    if (rows.length === 0) {
      return normalizeScheduleHourRange(
        WEEK_VIEW_DEFAULT_START_HOUR,
        WEEK_VIEW_DEFAULT_END_HOUR,
      );
    }

    let startHour = Number.POSITIVE_INFINITY;
    let endHour = Number.NEGATIVE_INFINITY;

    for (const row of rows) {
      startHour = Math.min(
        startHour,
        parseScheduleHour(row.startHour, WEEK_VIEW_DEFAULT_START_HOUR),
      );
      endHour = Math.max(
        endHour,
        parseScheduleHour(row.endHour, WEEK_VIEW_DEFAULT_END_HOUR),
      );
    }

    return normalizeScheduleHourRange(startHour, endHour);
  }, [rows]);
}
