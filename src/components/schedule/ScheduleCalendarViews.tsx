import { memo, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { AddAppointmentSheet } from "@/components/schedule/addAppointment";
import { DayCalendar } from "@/components/schedule/dayView";
import { MonthCalendar } from "@/components/schedule/monthView";
import { ScheduleScreen } from "@/components/schedule/ScheduleScreen";
import { WeekCalendar } from "@/components/schedule/weekView";
import {
  useScheduleViewModeStore,
  type ScheduleViewMode,
} from "@/stores/scheduleViewModeStore";

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

  return (
    <>
      <ScheduleScreen>
        <View style={styles.host}>
          <CalendarLayer activeMode={viewMode} mode="month">
            <MonthCalendar weekStartsOn={1} />
          </CalendarLayer>
          <CalendarLayer activeMode={viewMode} mode="week">
            <WeekCalendar weekStartsOn={1} />
          </CalendarLayer>
          <CalendarLayer activeMode={viewMode} mode="day">
            <DayCalendar weekStartsOn={1} />
          </CalendarLayer>
        </View>
      </ScheduleScreen>
      <AddAppointmentSheet />
    </>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});

export const ScheduleCalendarViews = memo(ScheduleCalendarViewsComponent);
