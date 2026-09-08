import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";

import { DayEventsSheet } from "@/components/schedule/dayEventsSheet";
import { WEEK_VIEW_GUTTER_WIDTH } from "@/constants/schedule";
import { WeekHighlightDayContext } from "@/contexts/WeekHighlightDayContext";
import { useDayEventsSheetProgress } from "@/hooks/schedule/useDayEventsSheetProgress";
import { useWeekAppointmentsCache } from "@/hooks/schedule/useWeekAppointmentsCache";
import { useVisibleWeek } from "@/hooks/schedule/useVisibleWeek";
import {
  selectCalendarDay,
  useCalendarSelectionStore,
} from "@/stores/calendarSelectionStore";
import type { DayEventsSheetHandle } from "@/types/schedule";
import {
  addDays,
  parseDayKey,
  toDayKey,
  weekdayOffset,
  type DayKey,
  type WeekdayIndex,
} from "@/helpers/schedule/calendar";

import { WeekCalendarHeader } from "./WeekCalendarHeader";
import { WeekCalendarPager } from "./WeekCalendarPager";

export type WeekCalendarProps = {
  weekStartsOn?: WeekdayIndex;
};

/** Week view shell — header, day row, timed grids, and day-events sheet. */
export function WeekCalendar({ weekStartsOn = 0 }: WeekCalendarProps) {
  const {
    weeks,
    initialIndex,
    pageIndex,
    visibleWeekStart,
    isDragging,
    onPageSelected: onPageSelectedBase,
    onPageScrollStateChanged,
  } = useVisibleWeek(weekStartsOn);

  const { ensureVisibleWindow, getEventsForWeek, getEventsForDay } =
    useWeekAppointmentsCache({
      isDragging,
    });

  const selectedDayKey = useCalendarSelectionStore((s) => s.selectedDayKey);
  /** Header highlight — cleared when the sheet closes so no day stays selected. */
  const [highlightDayKey, setHighlightDayKey] = useState<DayKey | null>(null);
  const sheetDayKey = highlightDayKey ?? selectedDayKey;
  const events = getEventsForDay(sheetDayKey);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [hostHeight, setHostHeight] = useState(0);
  const [chromeHeight, setChromeHeight] = useState(0);
  const [dayHeaderHeight, setDayHeaderHeight] = useState(0);

  const sheetRef = useRef<DayEventsSheetHandle>(null);
  const isDraggingRef = useRef(isDragging);
  isDraggingRef.current = isDragging;
  const selectedDayKeyRef = useRef(selectedDayKey);
  selectedDayKeyRef.current = selectedDayKey;
  const highlightDayKeyRef = useRef(highlightDayKey);
  highlightDayKeyRef.current = highlightDayKey;
  const pageIndexRef = useRef(pageIndex);
  pageIndexRef.current = pageIndex;
  const sheetOpenRef = useRef(sheetOpen);
  sheetOpenRef.current = sheetOpen;

  const sheetSnapHeight = useMemo(() => {
    if (hostHeight <= 0 || dayHeaderHeight <= 0) return 0;
    return Math.max(
      0,
      Math.round(hostHeight - chromeHeight - dayHeaderHeight),
    );
  }, [chromeHeight, dayHeaderHeight, hostHeight]);

  const handleSettledOpen = useCallback(() => {
    setSheetOpen(true);
    sheetOpenRef.current = true;
    setHighlightDayKey((prev) => prev ?? selectedDayKeyRef.current);
  }, []);

  const handleSettledClosed = useCallback(() => {
    setSheetOpen(false);
    sheetOpenRef.current = false;
    setHighlightDayKey(null);
  }, []);

  const handleMotionStart = useCallback(() => {}, []);

  const {
    setSnapHeight,
    sheetAnimatedStyle,
    sheetAnimatedProps,
    beginDrag,
    applyDragTranslation,
    endDrag,
    open: openSheet,
    close: closeSheet,
  } = useDayEventsSheetProgress({
    onSettledOpen: handleSettledOpen,
    onSettledClosed: handleSettledClosed,
    onMotionStart: handleMotionStart,
  });

  // Keep shared snap height in sync before the next press can open the sheet.
  useEffect(() => {
    setSnapHeight(sheetSnapHeight);
  }, [setSnapHeight, sheetSnapHeight]);

  useEffect(() => {
    ensureVisibleWindow(visibleWeekStart);
  }, [ensureVisibleWindow, visibleWeekStart]);

  const weekEndKey = useMemo(
    () => toDayKey(addDays(parseDayKey(visibleWeekStart), 6)),
    [visibleWeekStart],
  );

  const settleSheetOpen = useCallback(() => {
    if (isDraggingRef.current) return;
    // Already open or opening — skip (keeps day switches instant).
    if (sheetOpenRef.current) return;
    if (sheetSnapHeight <= 0) return;
    sheetOpenRef.current = true;
    setHighlightDayKey((prev) => prev ?? selectedDayKeyRef.current);
    // Ensure UI-thread snap height is current before the spring starts.
    setSnapHeight(sheetSnapHeight);
    // Spring open first; React sheetOpen follows in onSettledOpen so the pager
    // does not rebuild before the sheet begins animating.
    openSheet();
  }, [openSheet, setSnapHeight, sheetSnapHeight]);

  const handleDayPress = useCallback(
    (dayKey: DayKey, _alreadySelected: boolean) => {
      setHighlightDayKey(dayKey);
      settleSheetOpen();
    },
    [settleSheetOpen],
  );

  const handlePageSelected = useCallback(
    (event: Parameters<typeof onPageSelectedBase>[0]) => {
      const nextIndex = event.nativeEvent.position;
      const prevIndex = pageIndexRef.current;
      onPageSelectedBase(event);

      if (!sheetOpenRef.current || nextIndex === prevIndex) return;

      const anchor =
        highlightDayKeyRef.current ?? selectedDayKeyRef.current;
      const column = weekdayOffset(parseDayKey(anchor), weekStartsOn);
      const nextWeekStart = weeks[nextIndex];
      if (!nextWeekStart) return;

      const nextDayKey = toDayKey(addDays(parseDayKey(nextWeekStart), column));
      setHighlightDayKey(nextDayKey);
      selectCalendarDay(nextDayKey);
    },
    [onPageSelectedBase, weekStartsOn, weeks],
  );

  const onHostLayout = useCallback((event: LayoutChangeEvent) => {
    setHostHeight(event.nativeEvent.layout.height);
  }, []);

  const onChromeLayout = useCallback((event: LayoutChangeEvent) => {
    setChromeHeight(event.nativeEvent.layout.height);
  }, []);

  const onDayHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    setDayHeaderHeight((prev) => (prev === next ? prev : next));
  }, []);

  return (
    <WeekHighlightDayContext.Provider value={highlightDayKey}>
      <View
        onLayout={onHostLayout}
        style={{ flex: 1, width: "100%", alignSelf: "stretch" }}
      >
        <View onLayout={onChromeLayout}>
          <WeekCalendarHeader
            weekStartKey={visibleWeekStart}
            weekEndKey={weekEndKey}
          />
        </View>

        <View style={{ flex: 1, overflow: "hidden" }}>
          <WeekCalendarPager
            weeks={weeks}
            initialIndex={initialIndex}
            pageIndex={pageIndex}
            weekStartsOn={weekStartsOn}
            gutterWidth={WEEK_VIEW_GUTTER_WIDTH}
            getEventsForWeek={getEventsForWeek}
            onPageSelected={handlePageSelected}
            onPageScrollStateChanged={onPageScrollStateChanged}
            onDayPress={handleDayPress}
            onDayHeaderLayout={onDayHeaderLayout}
            sheetOpen={sheetOpen}
          />

          <DayEventsSheet
            ref={sheetRef}
            dayKey={sheetDayKey}
            events={events}
            snapHeight={sheetSnapHeight}
            sheetAnimatedStyle={sheetAnimatedStyle}
            sheetAnimatedProps={sheetAnimatedProps}
            beginDrag={beginDrag}
            applyDragTranslation={applyDragTranslation}
            endDrag={endDrag}
            open={openSheet}
            close={closeSheet}
          />
        </View>
      </View>
    </WeekHighlightDayContext.Provider>
  );
}
