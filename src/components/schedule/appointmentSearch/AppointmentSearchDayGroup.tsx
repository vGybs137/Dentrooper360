import dayjs from "dayjs";
import { memo, useMemo } from "react";
import { View } from "react-native";

import { AppointmentSearchResultItem } from "@/components/schedule/appointmentSearch/AppointmentSearchResultItem";
import { ThemedText, ThemedView } from "@/components/ui";
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
  const dayLabel = useMemo(() => formatSearchDayLabel(dayKey), [dayKey]);
  const isToday = useMemo(
    () => sameDay(parseDayKey(dayKey), todayCalendarDate()),
    [dayKey],
  );

  return (
    <View className="px-page pb-section">
      <View className="mb-stack-compact flex-row items-center gap-gap">
        {isToday ? (
          <ThemedView className="rounded-control bg-surface-inverse px-inline-compact py-stack-compact">
            <ThemedText className="font-bold" tone="inverse" variant="label">
              Today
            </ThemedText>
          </ThemedView>
        ) : null}
        <ThemedText tone="muted" variant="label">
          {dayLabel}
        </ThemedText>
      </View>
      <ThemedView inset="none" surface="sunken" variant="card">
        {events.map((event, index) => (
          <View key={event.id}>
            {index > 0 ? (
              <View className="py-stack-default">
                <View className="h-px bg-border-subtle" />
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
