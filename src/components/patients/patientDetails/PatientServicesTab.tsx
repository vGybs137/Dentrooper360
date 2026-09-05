import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  View,
  type FlatList as FlatListType,
} from "react-native";

import { AppointmentSearchDayGroup } from "@/components/schedule/appointmentSearch/AppointmentSearchDayGroup";
import { ThemedText } from "@/components/ui";
import type { PatientServiceItem } from "@/hooks/usePatientServices";
import { useAuthUser } from "@/stores";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";
import {
  parseDayKey,
  toDayKey,
  toLocalDate,
  todayCalendarDate,
  type DayKey,
} from "@/utils/calendar";

import { PatientServiceResultItem } from "./PatientServiceResultItem";

type PatientServicesTabProps = {
  services: readonly PatientServiceItem[];
  isLoading: boolean;
};

type PatientServiceDayGroup = {
  dayKey: DayKey;
  items: PatientServiceItem[];
};

function groupServicesByDay(
  services: readonly PatientServiceItem[],
): PatientServiceDayGroup[] {
  const groups = new Map<DayKey, PatientServiceItem[]>();

  for (const service of services) {
    const dayKey = toDayKey(service.date);
    const existing = groups.get(dayKey);

    if (existing) {
      existing.push(service);
    } else {
      groups.set(dayKey, [service]);
    }
  }

  return [...groups.entries()].map(([dayKey, items]) => ({
    dayKey,
    items,
  }));
}

/** Index of today, or the temporally closest day (prefer future on ties). */
function findClosestDayGroupIndex(
  groups: readonly PatientServiceDayGroup[],
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

export function PatientServicesTab({
  services,
  isLoading,
}: PatientServicesTabProps) {
  const native = useNativeColors();
  const user = useAuthUser();
  const listRef = useRef<FlatListType<PatientServiceDayGroup>>(null);
  const hasScrolledToToday = useRef(false);

  const dayGroups = useMemo(() => groupServicesByDay(services), [services]);

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

  const currency = user?.currencySymbol;

  const renderItem = useCallback(
    ({ item }: { item: PatientServiceDayGroup }) => (
      <AppointmentSearchDayGroup
        dayKey={item.dayKey}
        items={item.items}
        renderItem={(service) => (
          <PatientServiceResultItem currency={currency} item={service} />
        )}
      />
    ),
    [currency],
  );

  if (isLoading) {
    return (
      <View className="items-center py-section">
        <ActivityIndicator color={native.brand.default} />
      </View>
    );
  }

  if (services.length === 0) {
    return (
      <ThemedText className="px-page py-stack" tone="muted" variant="body">
        No services recorded for this patient yet.
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
