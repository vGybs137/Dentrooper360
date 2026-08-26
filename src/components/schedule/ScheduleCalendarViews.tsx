import { memo, useEffect, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { DayCalendar } from "@/components/schedule/dayView";
import { MonthCalendar } from "@/components/schedule/monthView";
import { ScheduleScreen } from "@/components/schedule/ScheduleScreen";
import { WeekCalendar } from "@/components/schedule/weekView";
import {
  applyScheduleViewPreference,
  useScheduleViewModeStore,
  type ScheduleViewMode,
} from "@/stores/scheduleViewModeStore";
import {
  useSchedulePreferencesHasHydrated,
  useWeekStartsOn,
} from "@/stores/schedulePreferencesStore";

type CalendarLayerProps = {
  mode: ScheduleViewMode;
  activeMode: ScheduleViewMode;
  children: ReactNode;
};

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
  const viewMode = useScheduleViewModeStore((state) => state.viewMode);
  const weekStartsOn = useWeekStartsOn();
  const preferencesHydrated = useSchedulePreferencesHasHydrated();

  useEffect(() => {
    if (!preferencesHydrated) {
      return;
    }
    applyScheduleViewPreference();
  }, [preferencesHydrated]);

  return (
    <ScheduleScreen>
      <View style={styles.host}>
        <CalendarLayer activeMode={viewMode} mode="month">
          <MonthCalendar weekStartsOn={weekStartsOn} />
        </CalendarLayer>
        <CalendarLayer activeMode={viewMode} mode="week">
          <WeekCalendar weekStartsOn={weekStartsOn} />
        </CalendarLayer>
        <CalendarLayer activeMode={viewMode} mode="day">
          <DayCalendar weekStartsOn={weekStartsOn} />
        </CalendarLayer>
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
