import { useCallback, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  View,
  type FlatList as FlatListType,
} from "react-native";

import { AppointmentSearchDayGroup } from "@/components/schedule/appointmentSearch/AppointmentSearchDayGroup";
import { AppointmentSearchResultItem } from "@/components/schedule/appointmentSearch/AppointmentSearchResultItem";
import { EmptyState, ThemedText } from "@/components/ui";
import { calendarIcon } from "@/constants";
import type { PatientAppointmentItem } from "@/hooks/patients/usePatientAppointments";
import { useScrollToClosestDay } from "@/hooks/ui/useScrollToClosestDay";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";
import type { MonthDayEventPreview } from "@/types/schedule";
import { toDayKey, type DayKey } from "@/helpers/schedule/calendar";

type PatientAppointmentsTabProps = {
  appointments: readonly PatientAppointmentItem[];
  isLoading: boolean;
  error?: Error | null;
  onAddAppointment?: () => void;
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

export function PatientAppointmentsTab({
  appointments,
  isLoading,
  error = null,
  onAddAppointment,
}: PatientAppointmentsTabProps) {
  const native = useNativeColors();
  const listRef = useRef<FlatListType<PatientAppointmentDayGroup>>(null);

  const dayGroups = useMemo(
    () => groupAppointmentsByDay(appointments),
    [appointments],
  );

  const { onScrollToIndexFailed } = useScrollToClosestDay(
    listRef,
    dayGroups,
    isLoading,
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

  if (error) {
    return (
      <ThemedText className="px-page py-stack" tone="alert" variant="body">
        Unable to load appointments for this patient.
      </ThemedText>
    );
  }

  if (appointments.length === 0) {
    return (
      <EmptyState
        action={
          onAddAppointment
            ? { label: "Add appointment", onPress: onAddAppointment }
            : null
        }
        icon={calendarIcon}
        title="No appointments"
      />
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
