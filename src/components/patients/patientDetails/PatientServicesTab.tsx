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
import type { PatientServiceItem } from "@/hooks/patients/usePatientServices";
import { useScrollToClosestDay } from "@/hooks/ui/useScrollToClosestDay";
import { useAuthUser } from "@/stores";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";
import { toDayKey, type DayKey } from "@/helpers/schedule/calendar";

import { PatientServiceResultItem } from "./PatientServiceResultItem";

type PatientServicesTabProps = {
  services: readonly PatientServiceItem[];
  isLoading: boolean;
  error?: Error | null;
};

type PatientServiceDayGroup = {
  dayKey: DayKey;
  items: PatientServiceItem[];
};

export function PatientServicesTab({
  services,
  isLoading,
  error = null,
}: PatientServicesTabProps) {
  const native = useNativeColors();
  const user = useAuthUser();
  const listRef = useRef<FlatListType<PatientServiceDayGroup>>(null);

  const dayGroups = useMemo(
    () => groupByDayKey(services, (service) => toDayKey(service.date)),
    [services],
  );

  const { onScrollToIndexFailed } = useScrollToClosestDay(
    listRef,
    dayGroups,
    isLoading,
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

  if (error) {
    return (
      <ThemedText className="px-page py-stack" tone="alert" variant="body">
        Unable to load services for this patient.
      </ThemedText>
    );
  }

  if (services.length === 0) {
    return (
      <ThemedText className="px-page py-stack" tone="muted" variant="body">
        No services for this patient yet.
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
