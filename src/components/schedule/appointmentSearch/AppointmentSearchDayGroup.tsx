import dayjs from "dayjs";
import { memo, useMemo, type ReactNode } from "react";
import { View } from "react-native";

import { ThemedText, ThemedView } from "@/components/ui";
import {
  parseDayKey,
  sameDay,
  toLocalDate,
  todayCalendarDate,
  type DayKey,
} from "@/helpers/schedule/calendar";

export type AppointmentSearchDayGroupProps<T extends { id: string }> = {
  dayKey: DayKey;
  items: readonly T[];
  renderItem: (item: T) => ReactNode;
};

/** e.g. "Mon, Jan 15, 2024" */
export function formatSearchDayLabel(dayKey: DayKey): string {
  return dayjs(toLocalDate(parseDayKey(dayKey))).format("ddd, MMM DD, YYYY");
}

function AppointmentSearchDayGroupComponent<T extends { id: string }>({
  dayKey,
  items,
  renderItem,
}: AppointmentSearchDayGroupProps<T>) {
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
        {items.map((item, index) => (
          <View key={item.id}>
            {index > 0 ? (
              <View className="py-stack-default">
                <View className="h-px bg-border-subtle" />
              </View>
            ) : null}
            {renderItem(item)}
          </View>
        ))}
      </ThemedView>
    </View>
  );
}

export const AppointmentSearchDayGroup = memo(
  AppointmentSearchDayGroupComponent,
) as <T extends { id: string }>(
  props: AppointmentSearchDayGroupProps<T>,
) => ReactNode;
