import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type PersistStorage,
} from "zustand/middleware";

import { SCHEDULE_PREFERENCES_STORE_KEY } from "@/constants/storage";
import { getItem, setItem } from "@/helpers/secureStorage";
import type { WeekdayIndex } from "@/utils/calendar";

export type ScheduleViewMode = "month" | "week" | "day";

/** Fixed default view, or remember the last view the user opened. */
export type DefaultCalendarView = "last" | ScheduleViewMode;

export type HourFormat = "12h" | "24h";

type PersistedSchedulePreferences = {
  defaultCalendarView: DefaultCalendarView;
  hourFormat: HourFormat;
  weekStartsOn: WeekdayIndex;
  /** Last view the user selected in the schedule drawer. */
  lastViewMode: ScheduleViewMode;
  /** Preferred location for new appointments (quick add + add modal). */
  defaultLocationId: string | null;
};

type SchedulePreferencesState = PersistedSchedulePreferences & {
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setDefaultCalendarView: (value: DefaultCalendarView) => void;
  setHourFormat: (value: HourFormat) => void;
  setWeekStartsOn: (value: WeekdayIndex) => void;
  setLastViewMode: (value: ScheduleViewMode) => void;
  setDefaultLocationId: (value: string | null) => void;
};

const securePersistStorage: PersistStorage<PersistedSchedulePreferences> =
  createJSONStorage<PersistedSchedulePreferences>(() => ({
    getItem: (name) => getItem(name),
    setItem: (name, value) => setItem(name, value),
    removeItem: (name) => setItem(name, null),
  }))!;

export const useSchedulePreferencesStore = create<SchedulePreferencesState>()(
  persist(
    (set, get) => ({
      defaultCalendarView: "last",
      hourFormat: "12h",
      weekStartsOn: 1,
      lastViewMode: "month",
      defaultLocationId: null,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setDefaultCalendarView: (defaultCalendarView) => {
        if (get().defaultCalendarView === defaultCalendarView) return;
        set({ defaultCalendarView });
      },
      setHourFormat: (hourFormat) => {
        if (get().hourFormat === hourFormat) return;
        set({ hourFormat });
      },
      setWeekStartsOn: (weekStartsOn) => {
        if (get().weekStartsOn === weekStartsOn) return;
        set({ weekStartsOn });
      },
      setLastViewMode: (lastViewMode) => {
        if (get().lastViewMode === lastViewMode) return;
        set({ lastViewMode });
      },
      setDefaultLocationId: (defaultLocationId) => {
        if (get().defaultLocationId === defaultLocationId) return;
        set({ defaultLocationId });
      },
    }),
    {
      name: SCHEDULE_PREFERENCES_STORE_KEY,
      storage: securePersistStorage,
      partialize: ({
        defaultCalendarView,
        hourFormat,
        weekStartsOn,
        lastViewMode,
        defaultLocationId,
      }) => ({
        defaultCalendarView,
        hourFormat,
        weekStartsOn,
        lastViewMode,
        defaultLocationId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function useDefaultCalendarView() {
  return useSchedulePreferencesStore((state) => state.defaultCalendarView);
}

export function useHourFormat() {
  return useSchedulePreferencesStore((state) => state.hourFormat);
}

export function useWeekStartsOn() {
  return useSchedulePreferencesStore((state) => state.weekStartsOn);
}

export function useDefaultLocationId() {
  return useSchedulePreferencesStore((state) => state.defaultLocationId);
}

export function useSchedulePreferencesHasHydrated() {
  return useSchedulePreferencesStore((state) => state.hasHydrated);
}

/** Prefer the saved default when it still exists; otherwise the first available. */
export function resolveDefaultLocationId(
  availableIds: readonly string[],
  preferredId: string | null = useSchedulePreferencesStore.getState()
    .defaultLocationId,
): string | null {
  if (preferredId && availableIds.includes(preferredId)) {
    return preferredId;
  }
  return availableIds[0] ?? null;
}

/** Resolved view to open: fixed preference, or last used when set to "last". */
export function resolveInitialScheduleViewMode(
  state: Pick<
    PersistedSchedulePreferences,
    "defaultCalendarView" | "lastViewMode"
  > = useSchedulePreferencesStore.getState(),
): ScheduleViewMode {
  if (state.defaultCalendarView === "last") {
    return state.lastViewMode;
  }
  return state.defaultCalendarView;
}
