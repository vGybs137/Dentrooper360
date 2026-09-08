import { useCallback, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  View,
  type FlatList as FlatListType,
} from "react-native";

import { AppointmentSearchDayGroup } from "@/components/schedule/appointmentSearch/AppointmentSearchDayGroup";
import { ThemedText } from "@/components/ui";
import { groupByDayKey } from "@/helpers/ui/dayGroups";
import type { PatientPaymentItem } from "@/hooks/patients/usePatientPayments";
import { useScrollToClosestDay } from "@/hooks/ui/useScrollToClosestDay";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";
import { toDayKey, type DayKey } from "@/helpers/schedule/calendar";

import { PatientPaymentResultItem } from "./PatientPaymentResultItem";

type PatientPaymentsTabProps = {
  payments: readonly PatientPaymentItem[];
  isLoading: boolean;
  error?: Error | null;
};

type PatientPaymentDayGroup = {
  dayKey: DayKey;
  items: PatientPaymentItem[];
};

export function PatientPaymentsTab({
  payments,
  isLoading,
  error = null,
}: PatientPaymentsTabProps) {
  const native = useNativeColors();
  const listRef = useRef<FlatListType<PatientPaymentDayGroup>>(null);

  const dayGroups = useMemo(
    () => groupByDayKey(payments, (payment) => toDayKey(payment.date)),
    [payments],
  );

  const { onScrollToIndexFailed } = useScrollToClosestDay(
    listRef,
    dayGroups,
    isLoading,
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

  if (error) {
    return (
      <ThemedText className="px-page py-stack" tone="alert" variant="body">
        Unable to load payments for this patient.
      </ThemedText>
    );
  }

  if (payments.length === 0) {
    return (
      <ThemedText className="px-page py-stack" tone="muted" variant="body">
        No payments for this patient yet.
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
      onScrollToIndexFailed={onScrollToIndexFailed}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
    />
  );
}
