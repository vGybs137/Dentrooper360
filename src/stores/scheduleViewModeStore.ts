import { create } from "zustand";

import {
  resolveInitialScheduleViewMode,
  useSchedulePreferencesStore,
  type ScheduleViewMode,
} from "@/stores/schedulePreferencesStore";

export type { ScheduleViewMode };

type ScheduleViewModeState = {
  viewMode: ScheduleViewMode;
  setViewMode: (viewMode: ScheduleViewMode) => void;
};

export const useScheduleViewModeStore = create<ScheduleViewModeState>((set, get) => ({
  viewMode: "month",
  setViewMode: (viewMode) => {
    if (get().viewMode === viewMode) return;
    set({ viewMode });
    useSchedulePreferencesStore.getState().setLastViewMode(viewMode);
  },
}));

export function setScheduleViewMode(viewMode: ScheduleViewMode): void {
  useScheduleViewModeStore.getState().setViewMode(viewMode);
}

/** Apply persisted default / last view after preferences hydrate. */
export function applyScheduleViewPreference(): void {
  const prefs = useSchedulePreferencesStore.getState();
  if (!prefs.hasHydrated) {
    return;
  }

  const next = resolveInitialScheduleViewMode(prefs);
  const store = useScheduleViewModeStore.getState();
  if (store.viewMode !== next) {
    // Set without rewriting lastViewMode when applying a fixed default.
    useScheduleViewModeStore.setState({ viewMode: next });
  }
}
