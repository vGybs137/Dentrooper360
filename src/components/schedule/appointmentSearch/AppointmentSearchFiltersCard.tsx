import { memo } from "react";
import { View } from "react-native";

import { Button, ColorSwatch, ThemedText, ThemedView } from "@/components/ui";
import {
  APPOINTMENT_SEARCH_TIME_WINDOWS,
  type AppointmentSearchTimeWindow,
} from "@/constants/appointmentSearch";
import type { AppointmentSearchTypeOption } from "@/hooks/useAppointmentSearch";
import { semantic } from "@/tokens";
import { cn } from "@/utils/cn";

export type AppointmentSearchFiltersCardProps = {
  types: AppointmentSearchTypeOption[];
  selectedTypeIds: readonly string[];
  onToggleType: (typeId: string) => void;
  timeWindow: AppointmentSearchTimeWindow;
  onSelectTimeWindow: (window: AppointmentSearchTimeWindow) => void;
};

function AppointmentSearchFiltersCardComponent({
  types,
  selectedTypeIds,
  onToggleType,
  timeWindow,
  onSelectTimeWindow,
}: AppointmentSearchFiltersCardProps) {
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
                onPress={() =>
                  onSelectTimeWindow(isSelected ? "all" : option.id)
                }
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
