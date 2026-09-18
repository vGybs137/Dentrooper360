import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type PersistStorage,
} from "zustand/middleware";

import { SCHEDULE_PREFERENCES_STORE_KEY } from "@/constants/storage";
import { getItem, setItem } from "@/security/vault/secureStorage";
import type { WeekdayIndex } from "@/helpers/schedule/calendar";

export type ScheduleViewMode = "month" | "week" | "day";

/** Fixed default view, or remember the last view the user opened. */
export type DefaultCalendarView = "last" | ScheduleViewMode;

export type HourFormat = "12h" | "24h";

export const DEFAULT_APPOINTMENT_DURATION_OPTIONS = [
  15, 30, 45, 60, 90,
] as const;

export type DefaultAppointmentDurationMinutes =
  (typeof DEFAULT_APPOINTMENT_DURATION_OPTIONS)[number];

type PersistedSchedulePreferences = {
  defaultCalendarView: DefaultCalendarView;
  hourFormat: HourFormat;
  weekStartsOn: WeekdayIndex;
  /** Last view the user selected in the schedule drawer. */
  lastViewMode: ScheduleViewMode;
  /** Preferred location for new appointments (quick add + add modal). */
  defaultLocationId: string | null;
  /** Default length for new appointment slots. */
  defaultAppointmentDurationMinutes: DefaultAppointmentDurationMinutes;
};

type SchedulePreferencesState = PersistedSchedulePreferences & {
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setDefaultCalendarView: (value: DefaultCalendarView) => void;
  setHourFormat: (value: HourFormat) => void;
  setWeekStartsOn: (value: WeekdayIndex) => void;
  setLastViewMode: (value: ScheduleViewMode) => void;
  setDefaultLocationId: (value: string | null) => void;
  setDefaultAppointmentDurationMinutes: (
    value: DefaultAppointmentDurationMinutes,
  ) => void;
};

const securePersistStorage: PersistStorage<PersistedSchedulePreferences> =
  createJSONStorage<PersistedSchedulePreferences>(() => ({
    getItem: (name) => getItem(name),
    setItem: (name, value) => setItem(name, value),
    removeItem: (name) => setItem(name, null),
  }))!;

function isDurationOption(
  value: number,
): value is DefaultAppointmentDurationMinutes {
  return (DEFAULT_APPOINTMENT_DURATION_OPTIONS as readonly number[]).includes(
    value,
  );
}

export const useSchedulePreferencesStore = create<SchedulePreferencesState>()(
  persist(
    (set, get) => ({
      defaultCalendarView: "last",
      hourFormat: "12h",
      weekStartsOn: 1,
      lastViewMode: "month",
      defaultLocationId: null,
      defaultAppointmentDurationMinutes: 60,
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
      setDefaultAppointmentDurationMinutes: (
        defaultAppointmentDurationMinutes,
      ) => {
        if (
          get().defaultAppointmentDurationMinutes ===
          defaultAppointmentDurationMinutes
        ) {
          return;
        }
        set({ defaultAppointmentDurationMinutes });
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
        defaultAppointmentDurationMinutes,
      }) => ({
        defaultCalendarView,
        hourFormat,
        weekStartsOn,
        lastViewMode,
        defaultLocationId,
        defaultAppointmentDurationMinutes,
      }),
      merge: (persisted, current) => {
        const stored =
          (persisted as Partial<PersistedSchedulePreferences> | undefined) ??
          {};
        const duration = stored.defaultAppointmentDurationMinutes ?? 60;
        return {
          ...current,
          ...stored,
          defaultAppointmentDurationMinutes: isDurationOption(duration)
            ? duration
            : 60,
        };
      },
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

export function useDefaultAppointmentDurationMinutes() {
  return useSchedulePreferencesStore(
    (state) => state.defaultAppointmentDurationMinutes,
  );
}

export function getDefaultAppointmentDurationMinutes(): DefaultAppointmentDurationMinutes {
  return useSchedulePreferencesStore.getState()
    .defaultAppointmentDurationMinutes;
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
