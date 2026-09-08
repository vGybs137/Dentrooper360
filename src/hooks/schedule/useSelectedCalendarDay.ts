import {
  selectCalendarDay,
  useCalendarSelectionStore,
} from "@/stores/calendarSelectionStore";
import type { DayKey } from "@/helpers/schedule/calendar";

export type UseSelectedCalendarDayResult = {
  selectedDayKey: DayKey;
  setSelectedDayKey: (dayKey: DayKey) => void;
  selectDay: (dayKey: DayKey) => void;
};

/**
 * Selected day for consumers outside DayCell (e.g. day sheet).
 * DayCell reads selection via useIsCalendarDaySelected for isolated re-renders.
 */
export function useSelectedCalendarDay(): UseSelectedCalendarDayResult {
  const selectedDayKey = useCalendarSelectionStore((s) => s.selectedDayKey);
  const setSelectedDayKey = useCalendarSelectionStore((s) => s.setSelectedDayKey);

  return {
    selectedDayKey,
    setSelectedDayKey,
    selectDay: selectCalendarDay,
  };
}
