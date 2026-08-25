import dayjs from "dayjs";
import { memo, useMemo } from "react";
import { View } from "react-native";

import { AppointmentSearchResultItem } from "@/components/schedule/appointmentSearch/AppointmentSearchResultItem";
import { Card, ThemedText } from "@/components/ui";
import { useThemeTokens } from "@/theme";
import type { MonthDayEventPreview } from "@/types/schedule";
import { parseDayKey, sameDay, toLocalDate, todayCalendarDate, type DayKey } from "@/utils/calendar";

export type AppointmentSearchDayGroupProps = {
  dayKey: DayKey;
  events: MonthDayEventPreview[];
  query?: string;
};

/** e.g. "Mon, Jan 15, 2024" */
export function formatSearchDayLabel(dayKey: DayKey): string {
  return dayjs(toLocalDate(parseDayKey(dayKey))).format("ddd, MMM DD, YYYY");
}

function AppointmentSearchDayGroupComponent({
  dayKey,
  events,
  query = "",
}: AppointmentSearchDayGroupProps) {
  const theme = useThemeTokens();
  const dayLabel = useMemo(() => formatSearchDayLabel(dayKey), [dayKey]);
  const isToday = useMemo(
    () => sameDay(parseDayKey(dayKey), todayCalendarDate()),
    [dayKey],
  );

  const groupStyle = useMemo(
    () => ({
      paddingHorizontal: theme.semantic.space.page,
      paddingBottom: theme.semantic.space.section,
    }),
    [theme],
  );

  const headerRowStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: theme.semantic.space.gap.default,
      marginBottom: theme.semantic.space.stack.compact,
    }),
    [theme],
  );

  const todayBadgeStyle = useMemo(
    () => ({
      borderRadius: theme.semantic.radius.control,
      paddingHorizontal: theme.semantic.space.inline.compact,
      paddingVertical: theme.semantic.space.stack.compact,
      backgroundColor: theme.palette.surface.inverse,
    }),
    [theme],
  );

  const todayTextStyle = useMemo(
    () => ({
      fontWeight: theme.primitives.fontWeight.bold as "700",
    }),
    [theme],
  );

  const separatorWrapStyle = useMemo(
    () => ({
      paddingVertical: theme.semantic.space.stack.default,
    }),
    [theme],
  );

  const separatorStyle = useMemo(
    () => ({
      height: theme.semantic.borderWidth.subtle,
      backgroundColor: theme.palette.border.subtle,
    }),
    [theme],
  );

  return (
    <View style={groupStyle}>
      <View style={headerRowStyle}>
        {isToday ? (
          <View style={todayBadgeStyle}>
            <ThemedText style={todayTextStyle} tone="inverse" variant="label">
              Today
            </ThemedText>
          </View>
        ) : null}
        <ThemedText tone="muted" variant="label">
          {dayLabel}
        </ThemedText>
      </View>
      <Card style={{ backgroundColor: theme.palette.surface.sunken }}>
        {events.map((event, index) => (
          <View key={event.id}>
            {index > 0 ? (
              <View style={separatorWrapStyle}>
                <View style={separatorStyle} />
              </View>
            ) : null}
            <AppointmentSearchResultItem event={event} query={query} />
          </View>
        ))}
      </Card>
    </View>
  );
}

export const AppointmentSearchDayGroup = memo(
  AppointmentSearchDayGroupComponent,
);
