import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { Calendar, type DateData } from "react-native-calendars";
import Animated from "react-native-reanimated";

import {
  applyCustomRangeDayPress,
  type AppointmentSearchCustomRange,
} from "@/constants/appointmentSearch";
import { useInlineCollapse } from "@/hooks/ui/useInlineCollapse";
import { useWeekStartsOn } from "@/stores";
import { useNativeColors } from "@/theme";
import type { DayKey } from "@/helpers/schedule/calendar";

const FALLBACK_CALENDAR_HEIGHT = 300;

type PeriodDayMarking = {
  startingDay?: boolean;
  endingDay?: boolean;
  color?: string;
  textColor?: string;
};

type MarkedDates = Record<string, PeriodDayMarking>;

export type AppointmentSearchCustomRangeCalendarProps = {
  visible: boolean;
  /** Completed filter range (shown when not mid-selection). */
  range: AppointmentSearchCustomRange | null;
  /** First tap awaiting confirmation / end day. */
  pendingStartDayKey: DayKey | null;
  onDayPressResult: (result: {
    pendingStartDayKey: DayKey | null;
    range: AppointmentSearchCustomRange | null;
    completed: boolean;
  }) => void;
};

function buildPeriodMarkedDates(
  range: AppointmentSearchCustomRange | null,
  pendingStartDayKey: DayKey | null,
  selectedColor: string,
  selectedTextColor: string,
): MarkedDates {
  const activeRange =
    pendingStartDayKey != null
      ? { startDayKey: pendingStartDayKey, endDayKey: pendingStartDayKey }
      : range;

  if (!activeRange) {
    return {};
  }

  const start = dayjs(activeRange.startDayKey);
  const end = dayjs(activeRange.endDayKey);
  const marks: MarkedDates = {};

  if (!start.isValid() || !end.isValid()) {
    return {};
  }

  let cursor = start;
  while (cursor.isBefore(end) || cursor.isSame(end, "day")) {
    const key = cursor.format("YYYY-MM-DD");
    const isStart = cursor.isSame(start, "day");
    const isEnd = cursor.isSame(end, "day");

    marks[key] = {
      startingDay: isStart,
      endingDay: isEnd,
      color: selectedColor,
      textColor: selectedTextColor,
    };

    cursor = cursor.add(1, "day");
  }

  return marks;
}

export function AppointmentSearchCustomRangeCalendar({
  visible,
  range,
  pendingStartDayKey,
  onDayPressResult,
}: AppointmentSearchCustomRangeCalendarProps) {
  const native = useNativeColors();
  const weekStartsOn = useWeekStartsOn();
  const initialMonth =
    pendingStartDayKey ??
    range?.startDayKey ??
    dayjs().format("YYYY-MM-DD");
  const [visibleMonth, setVisibleMonth] = useState(initialMonth);
  const [contentHeight, setContentHeight] = useState(FALLBACK_CALENDAR_HEIGHT);
  const { containerStyle, mounted } = useInlineCollapse(visible, contentHeight);

  const calendarTheme = useMemo(
    () => ({
      backgroundColor: "transparent",
      calendarBackground: "transparent",
      textSectionTitleColor: native.foreground.muted,
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

  const markedDates = useMemo(
    () =>
      buildPeriodMarkedDates(
        range,
        pendingStartDayKey,
        native.brand.default,
        native.brand.text,
      ),
    [native.brand.default, native.brand.text, pendingStartDayKey, range],
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);
    if (nextHeight > 0 && nextHeight !== contentHeight) {
      setContentHeight(nextHeight);
    }
  };

  const handleDayPress = (day: DateData) => {
    const dayKey = day.dateString as DayKey;
    onDayPressResult(applyCustomRangeDayPress(pendingStartDayKey, dayKey));
  };

  if (!mounted) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={containerStyle}
    >
      <View onLayout={handleLayout}>
        <Calendar
          current={visibleMonth}
          enableSwipeMonths
          firstDay={weekStartsOn}
          hideExtraDays
          markedDates={markedDates}
          markingType="period"
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
