import { memo, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { InteractionManager, StyleSheet, View } from "react-native";

import { DayCalendar } from "@/components/schedule/dayView";
import { MonthCalendar } from "@/components/schedule/monthView";
import { ScheduleScreen } from "@/components/schedule/ScheduleScreen";
import { WeekCalendar } from "@/components/schedule/weekView";
import {
  useSchedulePreferencesHasHydrated,
  useSchedulePreferencesStore,
  useWeekStartsOn,
} from "@/stores/schedulePreferencesStore";
import {
  applyScheduleViewPreference,
  useScheduleViewModeStore,
  type ScheduleViewMode,
} from "@/stores/scheduleViewModeStore";

type CalendarLayerProps = {
  mode: ScheduleViewMode;
  activeMode: ScheduleViewMode;
  children: ReactNode;
};

type MountedViews = Record<ScheduleViewMode, boolean>;

function mountedFor(active: ScheduleViewMode): MountedViews {
  return {
    month: active === "month",
    week: active === "week",
    day: active === "day",
  };
}

function rememberMode(
  prev: MountedViews,
  mode: ScheduleViewMode,
): MountedViews {
  if (prev[mode]) return prev;
  return { ...prev, [mode]: true };
}

function CalendarLayer({ mode, activeMode, children }: CalendarLayerProps) {
  const visible = mode === activeMode;

  return (
    <View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        StyleSheet.absoluteFill,
        { opacity: visible ? 1 : 0, zIndex: visible ? 1 : 0 },
      ]}
    >
      {children}
    </View>
  );
}

function ScheduleCalendarViewsComponent() {
  if (useSchedulePreferencesStore.getState().hasHydrated) {
    applyScheduleViewPreference();
  }

  const viewMode = useScheduleViewModeStore((state) => state.viewMode);
  const weekStartsOn = useWeekStartsOn();
  const preferencesHydrated = useSchedulePreferencesHasHydrated();
  const [mounted, setMounted] = useState<MountedViews>(() =>
    mountedFor(useScheduleViewModeStore.getState().viewMode),
  );

  useLayoutEffect(() => {
    if (!preferencesHydrated) {
      return;
    }
    applyScheduleViewPreference();
  }, [preferencesHydrated]);

  useLayoutEffect(() => {
    setMounted((prev) => rememberMode(prev, viewMode));
  }, [viewMode]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setMounted({ month: true, week: true, day: true });
    });
    return () => task.cancel();
  }, []);

  return (
    <ScheduleScreen>
      <View style={styles.host}>
        {mounted.month ? (
          <CalendarLayer activeMode={viewMode} mode="month">
            <MonthCalendar weekStartsOn={weekStartsOn} />
          </CalendarLayer>
        ) : null}
        {mounted.week ? (
          <CalendarLayer activeMode={viewMode} mode="week">
            <WeekCalendar weekStartsOn={weekStartsOn} />
          </CalendarLayer>
        ) : null}
        {mounted.day ? (
          <CalendarLayer activeMode={viewMode} mode="day">
            <DayCalendar weekStartsOn={weekStartsOn} />
          </CalendarLayer>
        ) : null}
      </View>
    </ScheduleScreen>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});

export const ScheduleCalendarViews = memo(ScheduleCalendarViewsComponent);
