import { create } from "zustand";

import { toDayKey, todayCalendarDate, type DayKey } from "@/helpers/schedule/calendar";

type CalendarSelectionState = {
  selectedDayKey: DayKey;
  selectDay: (dayKey: DayKey) => void;
  setSelectedDayKey: (dayKey: DayKey) => void;
};

export const useCalendarSelectionStore = create<CalendarSelectionState>(
  (set, get) => ({
    selectedDayKey: toDayKey(todayCalendarDate()),
    selectDay: (dayKey) => {
      if (get().selectedDayKey === dayKey) return;
      set({ selectedDayKey: dayKey });
    },
    setSelectedDayKey: (dayKey) => {
      if (get().selectedDayKey === dayKey) return;
      set({ selectedDayKey: dayKey });
    },
  }),
);

/** Subscribe only to whether a specific day is selected (isolates DayCell re-renders). */
export function useIsCalendarDaySelected(dayKey: DayKey): boolean {
  return useCalendarSelectionStore((s) => s.selectedDayKey === dayKey);
}

export function selectCalendarDay(dayKey: DayKey): void {
  useCalendarSelectionStore.getState().selectDay(dayKey);
}
