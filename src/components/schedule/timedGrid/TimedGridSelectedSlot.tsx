import { memo, useCallback } from "react";
import { View } from "react-native";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

import { Button, ThemedText } from "@/components/ui";
import {
  ADD_APPOINTMENT_SLOT_DURATION_MINUTES,
  useAddAppointmentStore,
} from "@/stores/addAppointmentStore";
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
  const native = useNativeColors();
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
    <Button
      accessibilityHint="Tap to add an appointment"
      accessibilityLabel="Selected time slot"
      nestedScroll
      onPress={handlePress}
      size="none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top,
        height,
        zIndex: 2,
      }}
      tone="neutral"
      variant="ghost"
    >
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: semantic.borderWidth.strong,
          borderStyle: "dashed",
          borderRadius: isWeek
            ? semantic.radius.control
            : semantic.radius.card,
          backgroundColor: `${native.brand.default}24`,
          borderColor: `${native.brand.strong}A6`,
        }}
      >
        <ThemedText
          style={{
            color: native.brand.strong,
            fontSize: isWeek ? 14 : 22,
            lineHeight: isWeek ? 16 : 24,
            fontWeight: "700",
          }}
        >
          +
        </ThemedText>
      </View>
    </Button>
  );
}

export const TimedGridSelectedSlot = memo(TimedGridSelectedSlotComponent);
