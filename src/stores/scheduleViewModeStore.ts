import { create } from "zustand";

export type ScheduleViewMode = "month" | "week";

type ScheduleViewModeState = {
  viewMode: ScheduleViewMode;
  setViewMode: (viewMode: ScheduleViewMode) => void;
};

export const useScheduleViewModeStore = create<ScheduleViewModeState>((set, get) => ({
  viewMode: "month",
  setViewMode: (viewMode) => {
    if (get().viewMode === viewMode) return;
    set({ viewMode });
  },
}));

export function setScheduleViewMode(viewMode: ScheduleViewMode): void {
  useScheduleViewModeStore.getState().setViewMode(viewMode);
}
