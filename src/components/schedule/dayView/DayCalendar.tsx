import { useMemo } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/ui";
import { WEEK_VIEW_GUTTER_WIDTH } from "@/constants/schedule";
import { useCalendarSelectionStore } from "@/stores/calendarSelectionStore";
import { useThemeTokens } from "@/theme";
import { formatDayKeyLabel } from "@/utils/calendar";

import { DayTimeGrid } from "./DayTimeGrid";

/** Step 3 stub — single-day timed grid for layout review (pager in Step 4). */
export function DayCalendar() {
  const theme = useThemeTokens();
  const selectedDayKey = useCalendarSelectionStore((state) => state.selectedDayKey);
  const label = useMemo(
    () => formatDayKeyLabel(selectedDayKey),
    [selectedDayKey],
  );

  const headerStyle = useMemo(
    () => ({
      paddingBottom: theme.semantic.space.stack.compact,
    }),
    [theme],
  );

  return (
    <View className="w-full flex-1 self-stretch">
      <View style={headerStyle}>
        <ThemedText variant="title">{label}</ThemedText>
      </View>
      <DayTimeGrid dayKey={selectedDayKey} gutterWidth={WEEK_VIEW_GUTTER_WIDTH} />
    </View>
  );
}
