import { useMemo, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { Calendar } from "react-native-calendars";
import Animated from "react-native-reanimated";

import {
  parseCalendarDateString,
  toCalendarDateString,
} from "@/helpers/appointmentDate";
import { useInlineCollapse } from "@/hooks/useInlineCollapse";
import { useNativeColors } from "@/theme";

const FALLBACK_CALENDAR_HEIGHT = 300;

type AppointmentInlineCalendarProps = {
  visible: boolean;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
};

export function AppointmentInlineCalendar({
  visible,
  selectedDate,
  onSelectDate,
}: AppointmentInlineCalendarProps) {
  const native = useNativeColors();
  const selectedDateValue = toCalendarDateString(selectedDate);
  const [visibleMonth, setVisibleMonth] = useState(selectedDateValue);
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
    () => ({
      [selectedDateValue]: {
        selected: true,
        selectedColor: native.brand.default,
      },
    }),
    [selectedDateValue, native.brand.default],
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);
    if (nextHeight > 0 && nextHeight !== contentHeight) {
      setContentHeight(nextHeight);
    }
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
          enableSwipeMonths
          hideExtraDays
          markedDates={markedDates}
          onDayPress={(day) => {
            const nextDate = parseCalendarDateString(day.dateString);
            onSelectDate(nextDate);
          }}
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
