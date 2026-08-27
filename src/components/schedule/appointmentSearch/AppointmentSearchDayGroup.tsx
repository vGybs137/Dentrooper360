import dayjs from "dayjs";
import { memo, useMemo } from "react";
import { View } from "react-native";

import { AppointmentSearchResultItem } from "@/components/schedule/appointmentSearch/AppointmentSearchResultItem";
import { ThemedText, ThemedView } from "@/components/ui";
import { useNativeColors } from "@/theme";
import { primitives, semantic } from "@/tokens";
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
  const native = useNativeColors();
  const dayLabel = useMemo(() => formatSearchDayLabel(dayKey), [dayKey]);
  const isToday = useMemo(
    () => sameDay(parseDayKey(dayKey), todayCalendarDate()),
    [dayKey],
  );

  const groupStyle = useMemo(
    () => ({
      paddingHorizontal: semantic.space.page,
      paddingBottom: semantic.space.section,
    }),
    [],
  );

  const headerRowStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: semantic.space.gap.default,
      marginBottom: semantic.space.stack.compact,
    }),
    [],
  );

  const todayBadgeStyle = useMemo(
    () => ({
      borderRadius: semantic.radius.control,
      paddingHorizontal: semantic.space.inline.compact,
      paddingVertical: semantic.space.stack.compact,
      backgroundColor: native.surface.inverse,
    }),
    [native],
  );

  const todayTextStyle = useMemo(
    () => ({
      fontWeight: primitives.fontWeight.bold as "700",
    }),
    [],
  );

  const separatorWrapStyle = useMemo(
    () => ({
      paddingVertical: semantic.space.stack.default,
    }),
    [],
  );

  const separatorStyle = useMemo(
    () => ({
      height: semantic.borderWidth.subtle,
      backgroundColor: native.border.subtle,
    }),
    [native],
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
      <ThemedView surface="sunken" variant="card">
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
      </ThemedView>
    </View>
  );
}

export const AppointmentSearchDayGroup = memo(
  AppointmentSearchDayGroupComponent,
);
