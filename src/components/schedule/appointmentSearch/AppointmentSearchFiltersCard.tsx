import { memo, useMemo } from "react";
import { Pressable, View } from "react-native";

import { Card, ColorSwatch, ThemedText } from "@/components/ui";
import type { AppointmentSearchTypeOption } from "@/hooks/useAppointmentSearch";
import { useThemeTokens } from "@/theme";
import { cn } from "@/utils/cn";

export type AppointmentSearchFiltersCardProps = {
  types: AppointmentSearchTypeOption[];
  selectedTypeIds: readonly string[];
  onToggleType: (typeId: string) => void;
};

function AppointmentSearchFiltersCardComponent({
  types,
  selectedTypeIds,
  onToggleType,
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

  if (types.length === 0) {
    return (
      <View className="px-page pt-stack-default">
        <Card>
          <ThemedText tone="muted" variant="body">
            No appointment types available.
          </ThemedText>
        </Card>
      </View>
    );
  }

  return (
    <View className="px-page pt-stack-default">
      <Card style={{ backgroundColor: theme.palette.surface.sunken }}>
        <View className="mt-stack-compact" style={pillsWrapStyle}>
          {types.map((type) => {
            const isSelected = selectedTypeIds.includes(type.id);

            return (
              <Pressable
                key={type.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Filter by ${type.name}`}
                onPress={() => onToggleType(type.id)}
                className={cn(
                  "flex-row items-center gap-gap-compact rounded-pill border px-inline py-stack-compact",
                  isSelected && !type.color && "bg-brand-subtle",
                )}
                style={{
                  borderColor: theme.palette.foreground.default,
                  ...(isSelected && type.color
                    ? { backgroundColor: theme.palette.surface.sunken }
                    : undefined),
                }}
              >
                {type.color ? (
                  <ColorSwatch
                    color={type.color}
                    size={theme.semantic.size["icon-sm"]}
                  />
                ) : null}
                <ThemedText variant="label">{type.name}</ThemedText>
              </Pressable>
            );
          })}
        </View>
      </Card>
    </View>
  );
}

export const AppointmentSearchFiltersCard = memo(
  AppointmentSearchFiltersCardComponent,
);
