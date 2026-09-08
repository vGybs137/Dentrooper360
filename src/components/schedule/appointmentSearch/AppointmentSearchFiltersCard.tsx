import { memo, useCallback } from "react";
import { View } from "react-native";

import { Button, ColorSwatch, ThemedText, ThemedView } from "@/components/ui";
import {
  APPOINTMENT_SEARCH_TIME_WINDOWS,
  type AppointmentSearchCustomRange,
  type AppointmentSearchTimeWindow,
} from "@/constants/appointmentSearch";
import type { AppointmentSearchTypeOption } from "@/hooks/schedule/useAppointmentSearch";
import { semantic } from "@/tokens";
import { cn } from "@/helpers/ui/cn";
import type { DayKey } from "@/helpers/schedule/calendar";

import { AppointmentSearchCustomRangeCalendar } from "./AppointmentSearchCustomRangeCalendar";

export type AppointmentSearchFiltersCardProps = {
  types: AppointmentSearchTypeOption[];
  selectedTypeIds: readonly string[];
  onToggleType: (typeId: string) => void;
  timeWindow: AppointmentSearchTimeWindow;
  onSelectTimeWindow: (window: AppointmentSearchTimeWindow) => void;
  customRange: AppointmentSearchCustomRange | null;
  customPendingStartDayKey: DayKey | null;
  customCalendarOpen: boolean;
  onCustomDayPressResult: (result: {
    pendingStartDayKey: DayKey | null;
    range: AppointmentSearchCustomRange | null;
    completed: boolean;
  }) => void;
};

function AppointmentSearchFiltersCardComponent({
  types,
  selectedTypeIds,
  onToggleType,
  timeWindow,
  onSelectTimeWindow,
  customRange,
  customPendingStartDayKey,
  customCalendarOpen,
  onCustomDayPressResult,
}: AppointmentSearchFiltersCardProps) {
  const customSelected = timeWindow === "custom";

  const handleSelectTimeWindow = useCallback(
    (optionId: Exclude<AppointmentSearchTimeWindow, "all">) => {
      if (optionId === "custom") {
        onSelectTimeWindow(customSelected ? "all" : "custom");
        return;
      }

      onSelectTimeWindow(timeWindow === optionId ? "all" : optionId);
    },
    [customSelected, onSelectTimeWindow, timeWindow],
  );

  return (
    <ThemedView className="px-page pt-stack-default" space="default" variant="stack">
      <ThemedView surface="sunken" variant="card">
        <View className="flex-row flex-wrap gap-gap-compact">
          {APPOINTMENT_SEARCH_TIME_WINDOWS.map((option) => {
            const isSelected = timeWindow === option.id;

            return (
              <Button
                key={option.id}
                accessibilityLabel={`Filter by ${option.label}`}
                accessibilityState={{ selected: isSelected }}
                className={cn(
                  "flex-row items-center gap-gap-compact rounded-pill border border-foreground-default px-inline py-stack-compact",
                  isSelected && "bg-brand-subtle",
                )}
                onPress={() => handleSelectTimeWindow(option.id)}
                ripple={false}
                size="none"
                tone="neutral"
                variant="ghost"
              >
                <ThemedText variant="label">{option.label}</ThemedText>
              </Button>
            );
          })}
        </View>

        <View className={customCalendarOpen ? "pt-stack-default" : undefined}>
          <AppointmentSearchCustomRangeCalendar
            onDayPressResult={onCustomDayPressResult}
            pendingStartDayKey={customPendingStartDayKey}
            range={customRange}
            visible={customCalendarOpen}
          />
        </View>
      </ThemedView>

      <ThemedView surface="sunken" variant="card">
        {types.length === 0 ? (
          <ThemedText tone="muted" variant="body">
            No appointment types available.
          </ThemedText>
        ) : (
          <View className="flex-row flex-wrap gap-gap-compact">
            {types.map((type) => {
              const isSelected = selectedTypeIds.includes(type.id);

              return (
                <Button
                  key={type.id}
                  accessibilityLabel={`Filter by ${type.name}`}
                  accessibilityState={{ selected: isSelected }}
                  className={cn(
                    "flex-row items-center gap-gap-compact rounded-pill border border-foreground-default px-inline py-stack-compact",
                    isSelected && !type.color && "bg-brand-subtle",
                    isSelected && type.color && "bg-surface-sunken",
                  )}
                  onPress={() => onToggleType(type.id)}
                  ripple={false}
                  size="none"
                  tone="neutral"
                  variant="ghost"
                >
                  {type.color ? (
                    <ColorSwatch
                      color={type.color}
                      size={semantic.size["icon-sm"]}
                    />
                  ) : null}
                  <ThemedText variant="label">{type.name}</ThemedText>
                </Button>
              );
            })}
          </View>
        )}
      </ThemedView>
    </ThemedView>
  );
}

export const AppointmentSearchFiltersCard = memo(
  AppointmentSearchFiltersCardComponent,
);
