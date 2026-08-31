import { useCallback, useEffect, useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import {
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import { MONTH_VIEW_SHEET_SWAP_PROGRESS } from "@/constants/schedule";
import { weekRowForDay } from "@/helpers/scheduleCalendar";
import { monthViewSheetSnapHeight } from "@/helpers/monthViewLayout";
import { useMonthViewLayout } from "@/hooks/schedule/useMonthViewLayout";
import {
  MONTH_GRID_ROWS,
  type DayKey,
  type WeekdayIndex,
  type YearMonth,
} from "@/utils/calendar";

export type UseMonthSheetGeometryOptions = {
  openProgress: SharedValue<number>;
  setSnapHeight: (height: number) => void;
  visibleMonth: YearMonth;
  weekStartsOn: WeekdayIndex;
  selectedDayKey: DayKey;
};

/**
 * First-frame pager/sheet geometry from window chrome, refined by onLayout
 * without unmounting the month grid.
 */
export function useMonthSheetGeometry({
  openProgress,
  setSnapHeight,
  visibleMonth,
  weekStartsOn,
  selectedDayKey,
}: UseMonthSheetGeometryOptions) {
  const layout = useMonthViewLayout();
  const pagerHeightSV = useSharedValue(layout.pagerHeight);
  const selectedRowSV = useSharedValue(
    weekRowForDay(visibleMonth, weekStartsOn, selectedDayKey),
  );

  const [hostHeight, setHostHeight] = useState(layout.hostHeight);
  const [chromeHeight, setChromeHeight] = useState(layout.chromeHeight);
  const [pagerHeight, setPagerHeight] = useState(layout.pagerHeight);

  const sheetSnapHeight = useMemo(() => {
    const host = hostHeight > 0 ? hostHeight : layout.hostHeight;
    const chrome = chromeHeight > 0 ? chromeHeight : layout.chromeHeight;
    const pager = pagerHeight > 0 ? pagerHeight : layout.pagerHeight;
    const measured = monthViewSheetSnapHeight(host, chrome, pager);
    return measured > 0 ? measured : layout.sheetSnapHeight;
  }, [
    chromeHeight,
    hostHeight,
    layout.chromeHeight,
    layout.hostHeight,
    layout.pagerHeight,
    layout.sheetSnapHeight,
    pagerHeight,
  ]);

  useEffect(() => {
    setSnapHeight(sheetSnapHeight);
  }, [setSnapHeight, sheetSnapHeight]);

  useEffect(() => {
    selectedRowSV.value = weekRowForDay(
      visibleMonth,
      weekStartsOn,
      selectedDayKey,
    );
  }, [selectedDayKey, selectedRowSV, visibleMonth, weekStartsOn]);

  const onHostLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    if (next > 0) setHostHeight(next);
  }, []);

  const onChromeLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    if (next > 0) setChromeHeight(next);
  }, []);

  const onPagerSlotLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const next = event.nativeEvent.layout.height;
      if (next <= 0) return;
      pagerHeightSV.value = next;
      setPagerHeight(next);
    },
    [pagerHeightSV],
  );

  const weekClipStyle = useAnimatedStyle(() => {
    const progress = openProgress.value;
    // Closed sheet: flex fills the pager slot so MonthGrid paints on frame 1
    // instead of sitting in a 1px box before onLayout measures pagerHeightSV.
    if (progress <= 0) {
      return { flex: 1, overflow: "hidden" as const };
    }
    const full = pagerHeightSV.value > 0 ? pagerHeightSV.value : 1;
    const week = full / MONTH_GRID_ROWS;
    return {
      height: interpolate(progress, [0, 1], [full, week]),
      overflow: "hidden" as const,
    };
  });

  const weekPinStyle = useAnimatedStyle(() => {
    const progress = openProgress.value;
    if (progress <= 0) {
      return { flex: 1 };
    }
    const full = pagerHeightSV.value > 0 ? pagerHeightSV.value : 1;
    const week = full / MONTH_GRID_ROWS;
    return {
      height: full,
      transform: [{ translateY: -selectedRowSV.value * week * progress }],
    };
  });

  const monthPagerVisibilityStyle = useAnimatedStyle(() => ({
    opacity: openProgress.value >= MONTH_VIEW_SHEET_SWAP_PROGRESS ? 0 : 1,
  }));

  const weekPagerVisibilityStyle = useAnimatedStyle(() => ({
    opacity: openProgress.value >= MONTH_VIEW_SHEET_SWAP_PROGRESS ? 1 : 0,
  }));

  // Touch targets follow visibility (openProgress), not sheetOpen. sheetOpen stays
  // true until the close spring settles — using it left the visible month
  // non-interactive so the first tap after close hit the invisible week/sheet.
  const monthTouchProps = useAnimatedProps(() => ({
    pointerEvents:
      openProgress.value < MONTH_VIEW_SHEET_SWAP_PROGRESS
        ? ("auto" as const)
        : ("none" as const),
  }));

  const weekTouchProps = useAnimatedProps(() => ({
    pointerEvents:
      openProgress.value >= MONTH_VIEW_SHEET_SWAP_PROGRESS
        ? ("auto" as const)
        : ("none" as const),
  }));

  const weekOverlayStyle = useAnimatedStyle(() => {
    const full = pagerHeightSV.value > 0 ? pagerHeightSV.value : 1;
    return {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      height: full / MONTH_GRID_ROWS,
    };
  });

  return {
    sheetSnapHeight,
    onHostLayout,
    onChromeLayout,
    onPagerSlotLayout,
    weekClipStyle,
    weekPinStyle,
    monthPagerVisibilityStyle,
    weekPagerVisibilityStyle,
    monthTouchProps,
    weekTouchProps,
    weekOverlayStyle,
  };
}
