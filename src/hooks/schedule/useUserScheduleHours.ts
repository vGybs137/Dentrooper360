import { useMemo } from "react";

import {
  WEEK_VIEW_DEFAULT_END_HOUR,
  WEEK_VIEW_DEFAULT_START_HOUR,
} from "@/constants/schedule";
import {
  normalizeScheduleHourRange,
  parseScheduleHour,
} from "@/helpers/scheduleHours";
import { useAuthUser } from "@/stores/authStore";

export type UserScheduleHours = {
  startHour: number;
  endHour: number;
};

/** User working hours from auth profile, with schedule defaults as fallback. */
export function useUserScheduleHours(): UserScheduleHours {
  const user = useAuthUser();

  return useMemo(() => {
    const startHour = parseScheduleHour(
      user?.startingHour,
      WEEK_VIEW_DEFAULT_START_HOUR,
    );
    const endHour = parseScheduleHour(
      user?.endingHour,
      WEEK_VIEW_DEFAULT_END_HOUR,
    );
    return normalizeScheduleHourRange(startHour, endHour);
  }, [user?.endingHour, user?.startingHour]);
}
