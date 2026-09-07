import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { Calendar, type DateData } from "react-native-calendars";
import Animated from "react-native-reanimated";

import {
  parseCalendarDateString,
  toCalendarDateString,
} from "@/helpers/appointmentDate";
import { closedWeekdayIndexes } from "@/helpers/scheduleHours";
import { useUserScheduleHours } from "@/hooks/schedule/useUserScheduleHours";
import { useInlineCollapse } from "@/hooks/useInlineCollapse";
import { useWeekStartsOn } from "@/stores";
import { useNativeColors } from "@/theme";
import type { WeekdayIndex } from "@/utils/calendar";

const FALLBACK_CALENDAR_HEIGHT = 300;

type DayMarking = {
  disabled?: boolean;
  disableTouchEvent?: boolean;
  selected?: boolean;
  selectedColor?: string;
};

type MarkedDates = Record<string, DayMarking>;

type AppointmentInlineCalendarProps = {
  visible: boolean;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
};

/** Map absolute weekday (0=Sun) → column index for `disabledDaysIndexes` / `firstDay`. */
function weekdayToColumnIndex(
  weekday: WeekdayIndex,
  weekStartsOn: WeekdayIndex,
): number {
  return (weekday - weekStartsOn + 7) % 7;
}

function markClosedDaysInMonth(
  monthAnchor: string,
  closedWeekdays: readonly WeekdayIndex[],
): MarkedDates {
  if (closedWeekdays.length === 0) {
    return {};
  }

  const closed = new Set<number>(closedWeekdays);
  const month = dayjs(monthAnchor);
  const daysInMonth = month.daysInMonth();
  const marks: MarkedDates = {};

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = month.date(day);
    if (!closed.has(date.day())) {
      continue;
    }

    marks[date.format("YYYY-MM-DD")] = {
      disabled: true,
      disableTouchEvent: true,
    };
  }

  return marks;
}

export function AppointmentInlineCalendar({
  visible,
  selectedDate,
  onSelectDate,
}: AppointmentInlineCalendarProps) {
  const native = useNativeColors();
  const weekStartsOn = useWeekStartsOn();
  const { hoursByWeekday, hasConfiguredHours } = useUserScheduleHours();
  const selectedDateValue = toCalendarDateString(selectedDate);
  const [visibleMonth, setVisibleMonth] = useState(selectedDateValue);
  const [contentHeight, setContentHeight] = useState(FALLBACK_CALENDAR_HEIGHT);
  const { containerStyle, mounted } = useInlineCollapse(visible, contentHeight);

  const closedWeekdays = useMemo(
    () => closedWeekdayIndexes(hoursByWeekday, hasConfiguredHours),
    [hasConfiguredHours, hoursByWeekday],
  );

  // Header prop is column-based (0 = firstDay), not Date#getDay.
  const disabledHeaderColumns = useMemo(
    () =>
      closedWeekdays.map((weekday) =>
        weekdayToColumnIndex(weekday, weekStartsOn),
      ),
    [closedWeekdays, weekStartsOn],
  );

  const closedWeekdaySet = useMemo(
    () => new Set<number>(closedWeekdays),
    [closedWeekdays],
  );

  const calendarTheme = useMemo(
    () => ({
      backgroundColor: "transparent",
      calendarBackground: "transparent",
      textSectionTitleColor: native.foreground.muted,
      // Keep closed weekday headers readable (muted, not washed out).
      textSectionTitleDisabledColor: native.foreground.muted,
      selectedDayBackgroundColor: native.brand.default,
      selectedDayTextColor: native.brand.text,
      todayTextColor: native.brand.default,
      dayTextColor: native.foreground.default,
      textDisabledColor: native.foreground.muted,
      monthTextColor: native.foreground.default,
      arrowColor: native.foreground.default,
      textDayFontWeight: "400" as const,
      textMonthFontWeight: "600" as const,
      textDayHeaderFontWeight: "500" as const,
      textDayFontSize: 16,
      textMonthFontSize: 17,
      textDayHeaderFontSize: 12,
    }),
    [native],
  );

  const markedDates = useMemo(() => {
    const marks = markClosedDaysInMonth(visibleMonth, closedWeekdays);

    marks[selectedDateValue] = {
      ...marks[selectedDateValue],
      selected: true,
      selectedColor: native.brand.default,
      disableTouchEvent: false,
    };

    return marks;
  }, [closedWeekdays, native.brand.default, selectedDateValue, visibleMonth]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);
    if (nextHeight > 0 && nextHeight !== contentHeight) {
      setContentHeight(nextHeight);
    }
  };

  const handleDayPress = (day: DateData) => {
    const nextDate = parseCalendarDateString(day.dateString);
    if (closedWeekdaySet.has(nextDate.getDay())) {
      return;
    }

    onSelectDate(nextDate);
  };

  if (!mounted) {
    return null;
  }

  return (
    <Animated.View
      style={containerStyle}
      pointerEvents={visible ? "auto" : "none"}
    >
      <View onLayout={handleLayout}>
        <Calendar
          current={visibleMonth}
          disableAllTouchEventsForDisabledDays
          disabledDaysIndexes={disabledHeaderColumns}
          enableSwipeMonths
          firstDay={weekStartsOn}
          hideExtraDays
          markedDates={markedDates}
          onDayPress={handleDayPress}
          onMonthChange={(month) => {
            setVisibleMonth(month.dateString);
          }}
          style={{
            borderWidth: 0,
            paddingLeft: 0,
            paddingRight: 0,
            paddingBottom: 0,
            marginBottom: 0,
          }}
          theme={calendarTheme}
        />
      </View>
    </Animated.View>
  );
}
