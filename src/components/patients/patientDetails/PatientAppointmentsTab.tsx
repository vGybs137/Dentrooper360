import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  View,
  type FlatList as FlatListType,
} from "react-native";

import { AppointmentSearchDayGroup } from "@/components/schedule/appointmentSearch/AppointmentSearchDayGroup";
import { AppointmentSearchResultItem } from "@/components/schedule/appointmentSearch/AppointmentSearchResultItem";
import { ThemedText } from "@/components/ui";
import type { PatientAppointmentItem } from "@/hooks/usePatientAppointments";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";
import type { MonthDayEventPreview } from "@/types/schedule";
import {
  parseDayKey,
  toDayKey,
  toLocalDate,
  todayCalendarDate,
  type DayKey,
} from "@/utils/calendar";

type PatientAppointmentsTabProps = {
  appointments: readonly PatientAppointmentItem[];
  isLoading: boolean;
};

type PatientAppointmentDayGroup = {
  dayKey: DayKey;
  events: MonthDayEventPreview[];
};

function toSearchPreview(item: PatientAppointmentItem): MonthDayEventPreview {
  return {
    id: item.id,
    title: item.subject,
    color: item.typeColor,
    typeName: item.typeName,
    startTime: item.startTime.getTime(),
    endTime: item.endTime.getTime(),
  };
}

function groupAppointmentsByDay(
  appointments: readonly PatientAppointmentItem[],
): PatientAppointmentDayGroup[] {
  const groups = new Map<DayKey, MonthDayEventPreview[]>();

  for (const appointment of appointments) {
    const dayKey = toDayKey(appointment.startTime);
    const preview = toSearchPreview(appointment);
    const existing = groups.get(dayKey);

    if (existing) {
      existing.push(preview);
    } else {
      groups.set(dayKey, [preview]);
    }
  }

  return [...groups.entries()].map(([dayKey, events]) => ({
    dayKey,
    events,
  }));
}

/** Index of today, or the temporally closest day (prefer future on ties). */
function findClosestDayGroupIndex(
  groups: readonly PatientAppointmentDayGroup[],
  todayKey: DayKey,
): number {
  if (groups.length === 0) {
    return -1;
  }

  const todayIndex = groups.findIndex((group) => group.dayKey === todayKey);
  if (todayIndex >= 0) {
    return todayIndex;
  }

  const todayMs = toLocalDate(parseDayKey(todayKey)).getTime();
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < groups.length; index += 1) {
    const dayMs = toLocalDate(parseDayKey(groups[index]!.dayKey)).getTime();
    const distance = Math.abs(dayMs - todayMs);

    if (
      distance < bestDistance ||
      (distance === bestDistance && dayMs >= todayMs)
    ) {
      bestDistance = distance;
      bestIndex = index;
    }
  }

  return bestIndex;
}

export function PatientAppointmentsTab({
  appointments,
  isLoading,
}: PatientAppointmentsTabProps) {
  const native = useNativeColors();
  const listRef = useRef<FlatListType<PatientAppointmentDayGroup>>(null);
  const hasScrolledToToday = useRef(false);

  const dayGroups = useMemo(
    () => groupAppointmentsByDay(appointments),
    [appointments],
  );

  const dayGroupKeys = useMemo(
    () => dayGroups.map((group) => group.dayKey).join("|"),
    [dayGroups],
  );

  useEffect(() => {
    if (isLoading || dayGroups.length === 0 || hasScrolledToToday.current) {
      return;
    }

    const todayKey = toDayKey(todayCalendarDate());
    const index = findClosestDayGroupIndex(dayGroups, todayKey);
    if (index < 0) {
      return;
    }

    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
        hasScrolledToToday.current = true;
      });
    }, 120);

    return () => clearTimeout(timer);
    // dayGroups is read when dayGroupKeys change (same render).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid re-anchoring on live refreshes
  }, [dayGroupKeys, isLoading]);

  const handleScrollToIndexFailed = useCallback(
    (info: {
      index: number;
      highestMeasuredFrameIndex: number;
      averageItemLength: number;
    }) => {
      listRef.current?.scrollToOffset({
        offset: Math.max(0, info.averageItemLength * info.index),
        animated: false,
      });
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({
          index: info.index,
          animated: true,
          viewPosition: 0.5,
        });
      });
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: PatientAppointmentDayGroup }) => (
      <AppointmentSearchDayGroup
        dayKey={item.dayKey}
        items={item.events}
        renderItem={(event) => <AppointmentSearchResultItem event={event} />}
      />
    ),
    [],
  );

  if (isLoading) {
    return (
      <View className="items-center py-section">
        <ActivityIndicator color={native.brand.default} />
      </View>
    );
  }

  if (appointments.length === 0) {
    return (
      <ThemedText className="px-page py-stack" tone="muted" variant="body">
        No appointments for this patient yet.
      </ThemedText>
    );
  }

  return (
    <FlatList
      ref={listRef}
      className="flex-1"
      contentContainerStyle={{ paddingBottom: semantic.space.stack.default }}
      data={dayGroups}
      keyExtractor={(item) => item.dayKey}
      onScrollToIndexFailed={handleScrollToIndexFailed}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
    />
  );
}
