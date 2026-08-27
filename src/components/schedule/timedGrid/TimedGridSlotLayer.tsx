import { memo, useCallback } from "react";
import { StyleSheet } from "react-native";
import type { GestureResponderEvent } from "react-native";

import { Button } from "@/components/ui";

import {
  useAddAppointmentSlot,
  useAddAppointmentStore,
} from "@/stores/addAppointmentStore";
import type { DayKey } from "@/utils/calendar";

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
  startHour: number;
  endHour: number;
  pxPerMinute: number;
  hourGap: number;
  variant?: "day" | "week";
};

function TimedGridSlotLayerComponent({
  dayKey,
  contentHeight,
  gridEdgeInset,
  startHour,
  endHour,
  pxPerMinute,
  hourGap,
  variant = "day",
}: TimedGridSlotLayerProps) {
  const slot = useAddAppointmentSlot();
  const selectSlot = useAddAppointmentStore((state) => state.selectSlot);

  const handleGridPress = useCallback(
    (event: GestureResponderEvent) => {
      const minutes = minutesFromGridY(
        event.nativeEvent.locationY,
        gridEdgeInset,
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
      hourGap,
      pxPerMinute,
      selectSlot,
      startHour,
    ],
  );

  const showSelectedSlot =
    slot != null && slotMatchesDay(slot.start, dayKey);

  return (
    <>
      <Button
        accessibilityLabel="Select time slot"
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
          startHour={startHour}
          startMinutes={minutesFromDate(slot.start)}
          topInset={gridEdgeInset}
          variant={variant}
        />
      ) : null}
    </>
  );
}

export const TimedGridSlotLayer = memo(TimedGridSlotLayerComponent);
