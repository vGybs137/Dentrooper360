import { createContext, useContext } from "react";

import type { DayKey } from "@/helpers/schedule/calendar";

/** Week header selection highlight; `null` means no day highlighted. */
export const WeekHighlightDayContext = createContext<DayKey | null>(null);

export function useWeekHighlightDayKey(): DayKey | null {
  return useContext(WeekHighlightDayContext);
}
