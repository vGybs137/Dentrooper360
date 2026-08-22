import { memo, useCallback } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/ui";
import {
  ADD_APPOINTMENT_SLOT_DURATION_MINUTES,
  useAddAppointmentStore,
} from "@/stores/addAppointmentStore";
import { useThemeTokens } from "@/theme";
import {
  minutesSpanToHeight,
  minutesToYInWorkingWindow,
} from "@/utils/calendar";

export type TimedGridSelectedSlotProps = {
  startMinutes: number;
  topInset: number;
  startHour: number;
  pxPerMinute: number;
  hourGap: number;
  variant?: "day" | "week";
};

function TimedGridSelectedSlotComponent({
  startMinutes,
  topInset,
  startHour,
  pxPerMinute,
  hourGap,
  variant = "day",
}: TimedGridSelectedSlotProps) {
  const theme = useThemeTokens();
  const open = useAddAppointmentStore((state) => state.open);

  const top =
    topInset +
    minutesToYInWorkingWindow(startMinutes, startHour, pxPerMinute, hourGap);
  const height = minutesSpanToHeight(
    startMinutes,
    startMinutes + ADD_APPOINTMENT_SLOT_DURATION_MINUTES,
    pxPerMinute,
    hourGap,
  );
  const isWeek = variant === "week";

  const handlePress = useCallback(() => {
    open();
  }, [open]);

  return (
    <Pressable
      accessibilityHint="Tap to add an appointment"
      accessibilityLabel="Selected time slot"
      accessibilityRole="button"
      onPress={handlePress}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top,
        height,
        zIndex: 2,
      }}
    >
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: theme.semantic.borderWidth.strong,
          borderStyle: "dashed",
          borderRadius: isWeek
            ? theme.semantic.radius.control
            : theme.semantic.radius.card,
          backgroundColor: `${theme.palette.brand.default}24`,
          borderColor: `${theme.palette.brand.strong}A6`,
        }}
      >
        <ThemedText
          style={{
            color: theme.palette.brand.strong,
            fontSize: isWeek ? 14 : 22,
            lineHeight: isWeek ? 16 : 24,
            fontWeight: "700",
          }}
        >
          +
        </ThemedText>
      </View>
    </Pressable>
  );
}

export const TimedGridSelectedSlot = memo(TimedGridSelectedSlotComponent);
