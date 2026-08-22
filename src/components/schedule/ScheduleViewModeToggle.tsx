import { memo, useMemo } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/ui";
import {
  useScheduleViewModeStore,
  type ScheduleViewMode,
} from "@/stores/scheduleViewModeStore";
import { useThemeTokens } from "@/theme";

const MODES: { mode: ScheduleViewMode; label: string }[] = [
  { mode: "month", label: "Month" },
  { mode: "week", label: "Week" },
  { mode: "day", label: "Day" },
];

function ScheduleViewModeToggleComponent() {
  const theme = useThemeTokens();
  const viewMode = useScheduleViewModeStore((state) => state.viewMode);
  const setViewMode = useScheduleViewModeStore((state) => state.setViewMode);

  const rootStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      borderRadius: theme.semantic.radius.pill,
      borderWidth: theme.semantic.borderWidth.subtle,
      borderColor: theme.colors.borderSubtle,
      overflow: "hidden" as const,
    }),
    [theme],
  );

  return (
    <View style={rootStyle}>
      {MODES.map(({ mode, label }) => {
        const selected = viewMode === mode;
        return (
          <Pressable
            key={mode}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => setViewMode(mode)}
            style={{
              paddingHorizontal: theme.semantic.space.stack.compact,
              paddingVertical: theme.primitives.space[2],
              backgroundColor: selected
                ? theme.palette.brand.default
                : "transparent",
            }}
          >
            <ThemedText tone={selected ? "inverse" : "muted"} variant="label">
              {label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

export const ScheduleViewModeToggle = memo(ScheduleViewModeToggleComponent);
