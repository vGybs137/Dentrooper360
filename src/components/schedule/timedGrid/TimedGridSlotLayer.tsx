import { memo, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import type { GestureResponderEvent } from "react-native";

import { Button } from "@/components/ui";
import { withOpacity } from "@/helpers/color";
import {
  useAddAppointmentSlot,
  useAddAppointmentStore,
} from "@/stores/addAppointmentStore";
import { useNativeColors } from "@/theme";
import {
  minutesToYInWorkingWindow,
  MINUTES_PER_HOUR,
  type DayKey,
} from "@/utils/calendar";

import { TimedGridSelectedSlot } from "./TimedGridSelectedSlot";
import {
  dateFromDayKeyAndMinutes,
  minutesFromDate,
  minutesFromGridY,
  slotMatchesDay,
} from "./timedGridSlotUtils";

export type TimedGridSlotLayerProps = {
  dayKey: DayKey;
  contentHeight: number;
  gridEdgeInset: number;
  /** Day's selectable working window. */
  startHour: number;
  endHour: number;
  /**
   * Shared Y-axis anchor (week envelope start). Defaults to `startHour`.
   */
  gridStartHour?: number;
  /** Inclusive end of the shared grid window (for non-working overlays). */
  gridEndHour?: number;
  pxPerMinute: number;
  hourGap: number;
  variant?: "day" | "week";
  /** When false, taps are disabled (closed day). */
  interactive?: boolean;
};

function NonWorkingRegions({
  gridEdgeInset,
  gridStartHour,
  gridEndHour,
  startHour,
  endHour,
  pxPerMinute,
  hourGap,
}: {
  gridEdgeInset: number;
  gridStartHour: number;
  gridEndHour: number;
  startHour: number;
  endHour: number;
  pxPerMinute: number;
  hourGap: number;
}) {
  const native = useNativeColors();
  const shade = withOpacity(native.foreground.muted, 0.08);
  const gridStartMinutes = gridStartHour * MINUTES_PER_HOUR;
  const gridEndMinutes = (gridEndHour + 1) * MINUTES_PER_HOUR;
  const dayStartMinutes = startHour * MINUTES_PER_HOUR;
  const dayEndMinutes = (endHour + 1) * MINUTES_PER_HOUR;

  const regions: { top: number; height: number; key: string }[] = [];

  if (dayStartMinutes > gridStartMinutes) {
    const top =
      gridEdgeInset +
      minutesToYInWorkingWindow(
        gridStartMinutes,
        gridStartHour,
        pxPerMinute,
        hourGap,
      );
    const bottom =
      gridEdgeInset +
      minutesToYInWorkingWindow(
        dayStartMinutes,
        gridStartHour,
        pxPerMinute,
        hourGap,
      );
    regions.push({ key: "before", top, height: Math.max(0, bottom - top) });
  }

  if (dayEndMinutes < gridEndMinutes) {
    const top =
      gridEdgeInset +
      minutesToYInWorkingWindow(
        dayEndMinutes,
        gridStartHour,
        pxPerMinute,
        hourGap,
      );
    const bottom =
      gridEdgeInset +
      minutesToYInWorkingWindow(
        gridEndMinutes,
        gridStartHour,
        pxPerMinute,
        hourGap,
      );
    regions.push({ key: "after", top, height: Math.max(0, bottom - top) });
  }

  return (
    <>
      {regions.map((region) =>
        region.height > 0 ? (
          <View
            key={region.key}
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: region.top,
              height: region.height,
              backgroundColor: shade,
            }}
          />
        ) : null,
      )}
    </>
  );
}

function TimedGridSlotLayerComponent({
  dayKey,
  contentHeight,
  gridEdgeInset,
  startHour,
  endHour,
  gridStartHour = startHour,
  gridEndHour = endHour,
  pxPerMinute,
  hourGap,
  variant = "day",
  interactive = true,
}: TimedGridSlotLayerProps) {
  const slot = useAddAppointmentSlot();
  const selectSlot = useAddAppointmentStore((state) => state.selectSlot);

  const handleGridPress = useCallback(
    (event: GestureResponderEvent) => {
      if (!interactive) {
        return;
      }

      const minutes = minutesFromGridY(
        event.nativeEvent.locationY,
        gridEdgeInset,
        gridStartHour,
        startHour,
        endHour,
        pxPerMinute,
        hourGap,
      );
      selectSlot(dateFromDayKeyAndMinutes(dayKey, minutes));
    },
    [
      dayKey,
      endHour,
      gridEdgeInset,
      gridStartHour,
      hourGap,
      interactive,
      pxPerMinute,
      selectSlot,
      startHour,
    ],
  );

  const showSelectedSlot =
    interactive && slot != null && slotMatchesDay(slot.start, dayKey);

  return (
    <>
      <NonWorkingRegions
        endHour={endHour}
        gridEdgeInset={gridEdgeInset}
        gridEndHour={gridEndHour}
        gridStartHour={gridStartHour}
        hourGap={hourGap}
        pxPerMinute={pxPerMinute}
        startHour={startHour}
      />
      <Button
        accessibilityLabel="Select time slot"
        disabled={!interactive}
        nestedScroll
        onPress={handleGridPress}
        ripple={false}
        size="none"
        style={[StyleSheet.absoluteFill, { height: contentHeight, zIndex: 1 }]}
        tone="neutral"
        variant="ghost"
      />
      {showSelectedSlot ? (
        <TimedGridSelectedSlot
          hourGap={hourGap}
          pxPerMinute={pxPerMinute}
          startHour={gridStartHour}
          startMinutes={minutesFromDate(slot.start)}
          topInset={gridEdgeInset}
          variant={variant}
        />
      ) : null}
    </>
  );
}

export const TimedGridSlotLayer = memo(TimedGridSlotLayerComponent);
