import { memo, useMemo } from "react";
import { View } from "react-native";

import { Button, ColorSwatch, ThemedText, ThemedView } from "@/components/ui";
import {
  APPOINTMENT_SEARCH_TIME_WINDOWS,
  type AppointmentSearchTimeWindow,
} from "@/constants/appointmentSearch";
import type { AppointmentSearchTypeOption } from "@/hooks/useAppointmentSearch";
import { useThemeTokens } from "@/theme";
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
  const theme = useThemeTokens();

  const pillsWrapStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: theme.semantic.space.gap.compact,
    }),
    [theme],
  );

  const cardsWrapStyle = useMemo(
    () => ({
      gap: theme.semantic.space.stack.default,
    }),
    [theme],
  );

  const cardStyle = useMemo(
    () => ({
      backgroundColor: theme.palette.surface.sunken,
    }),
    [theme],
  );

  return (
    <View className="px-page pt-stack-default" style={cardsWrapStyle}>
      <ThemedView variant="card" style={cardStyle}>
        <View style={pillsWrapStyle}>
          {APPOINTMENT_SEARCH_TIME_WINDOWS.map((option) => {
            const isSelected = timeWindow === option.id;

            return (
              <Button
                key={option.id}
                accessibilityLabel={`Filter by ${option.label}`}
                accessibilityState={{ selected: isSelected }}
                className={cn(
                  "flex-row items-center gap-gap-compact rounded-pill border px-inline py-stack-compact",
                  isSelected && "bg-brand-subtle",
                )}
                onPress={() =>
                  onSelectTimeWindow(isSelected ? "all" : option.id)
                }
                ripple={false}
                size="none"
                style={{
                  borderColor: theme.palette.foreground.default,
                }}
                tone="neutral"
                variant="ghost"
              >
                <ThemedText variant="label">{option.label}</ThemedText>
              </Button>
            );
          })}
        </View>
      </ThemedView>

      <ThemedView variant="card" style={cardStyle}>
        {types.length === 0 ? (
          <ThemedText tone="muted" variant="body">
            No appointment types available.
          </ThemedText>
        ) : (
          <View style={pillsWrapStyle}>
            {types.map((type) => {
              const isSelected = selectedTypeIds.includes(type.id);

              return (
                <Button
                  key={type.id}
                  accessibilityLabel={`Filter by ${type.name}`}
                  accessibilityState={{ selected: isSelected }}
                  className={cn(
                    "flex-row items-center gap-gap-compact rounded-pill border px-inline py-stack-compact",
                    isSelected && !type.color && "bg-brand-subtle",
                  )}
                  onPress={() => onToggleType(type.id)}
                  ripple={false}
                  size="none"
                  style={{
                    borderColor: theme.palette.foreground.default,
                    ...(isSelected && type.color
                      ? { backgroundColor: theme.palette.surface.sunken }
                      : undefined),
                  }}
                  tone="neutral"
                  variant="ghost"
                >
                  {type.color ? (
                    <ColorSwatch
                      color={type.color}
                      size={theme.semantic.size["icon-sm"]}
                    />
                  ) : null}
                  <ThemedText variant="label">{type.name}</ThemedText>
                </Button>
              );
            })}
          </View>
        )}
      </ThemedView>
    </View>
  );
}

export const AppointmentSearchFiltersCard = memo(
  AppointmentSearchFiltersCardComponent,
);
