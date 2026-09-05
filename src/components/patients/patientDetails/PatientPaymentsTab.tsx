import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  View,
  type FlatList as FlatListType,
} from "react-native";

import { AppointmentSearchDayGroup } from "@/components/schedule/appointmentSearch/AppointmentSearchDayGroup";
import { ThemedText } from "@/components/ui";
import type { PatientPaymentItem } from "@/hooks/usePatientPayments";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";
import {
  parseDayKey,
  toDayKey,
  toLocalDate,
  todayCalendarDate,
  type DayKey,
} from "@/utils/calendar";

import { PatientPaymentResultItem } from "./PatientPaymentResultItem";

type PatientPaymentsTabProps = {
  payments: readonly PatientPaymentItem[];
  isLoading: boolean;
};

type PatientPaymentDayGroup = {
  dayKey: DayKey;
  items: PatientPaymentItem[];
};

function groupPaymentsByDay(
  payments: readonly PatientPaymentItem[],
): PatientPaymentDayGroup[] {
  const groups = new Map<DayKey, PatientPaymentItem[]>();

  for (const payment of payments) {
    const dayKey = toDayKey(payment.date);
    const existing = groups.get(dayKey);

    if (existing) {
      existing.push(payment);
    } else {
      groups.set(dayKey, [payment]);
    }
  }

  return [...groups.entries()].map(([dayKey, items]) => ({
    dayKey,
    items,
  }));
}

/** Index of today, or the temporally closest day (prefer future on ties). */
function findClosestDayGroupIndex(
  groups: readonly PatientPaymentDayGroup[],
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

export function PatientPaymentsTab({
  payments,
  isLoading,
}: PatientPaymentsTabProps) {
  const native = useNativeColors();
  const listRef = useRef<FlatListType<PatientPaymentDayGroup>>(null);
  const hasScrolledToToday = useRef(false);

  const dayGroups = useMemo(() => groupPaymentsByDay(payments), [payments]);

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

  const renderItem = useCallback(
    ({ item }: { item: PatientPaymentDayGroup }) => (
      <AppointmentSearchDayGroup
        dayKey={item.dayKey}
        items={item.items}
        renderItem={(payment) => <PatientPaymentResultItem item={payment} />}
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

  if (payments.length === 0) {
    return (
      <ThemedText className="px-page py-stack" tone="muted" variant="body">
        No payments recorded for this patient yet.
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
