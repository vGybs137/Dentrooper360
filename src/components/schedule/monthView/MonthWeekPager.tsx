import React, {
  forwardRef,
  memo,
  useImperativeHandle,
  useMemo,
  useRef,
  type ComponentRef,
} from "react";
import { View } from "react-native";
import PagerView from "react-native-pager-view";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

import type { MonthAppointmentsCache } from "@/hooks/schedule/useMonthAppointmentsCache";
import { monthEventsSlice } from "@/helpers/schedule/scheduleEvents";
import {
  addMonths,
  focusMonthForWeek,
  toMonthKey,
  type DayKey,
} from "@/helpers/schedule/calendar";

import { MONTH_VIEW_PAGER_RENDER_RADIUS } from "@/constants/schedule";
import type { DayPressHandler, MonthWeekPagerHandle } from "@/types/schedule";
import type { DayCellEventIndicators } from "./DayCell";

import { MonthWeekStrip } from "./MonthWeekStrip";

export type { MonthWeekPagerHandle };

export type MonthWeekPagerProps = {
  weeks: DayKey[];
  initialIndex: number;
  pageIndex: number;
  appointmentsCache?: MonthAppointmentsCache;
  eventIndicators?: DayCellEventIndicators;
  scrollEnabled?: boolean;
  onDayPress?: DayPressHandler;
  onPageSelected: MonthWeekPagerOnPageSelected;
  onPageScrollStateChanged?: MonthWeekPagerOnPageScrollStateChanged;
};

type MonthWeekPagerOnPageSelected = NonNullable<
  React.ComponentProps<typeof PagerView>["onPageSelected"]
>;
type MonthWeekPagerOnPageScrollStateChanged = NonNullable<
  React.ComponentProps<typeof PagerView>["onPageScrollStateChanged"]
>;

type PagerViewRef = ComponentRef<typeof PagerView>;

/**
 * Horizontal snapped week pages (sheet-open mode).
 * Only nearby pages mount a real MonthWeekStrip for scroll performance.
 * Each strip receives focus-month (+ neighbor) day maps only.
 */
const MonthWeekPagerInner = forwardRef<MonthWeekPagerHandle, MonthWeekPagerProps>(
  function MonthWeekPagerInner(
    {
      weeks,
      initialIndex,
      pageIndex,
      appointmentsCache = {},
      eventIndicators = "dots",
      scrollEnabled = true,
      onDayPress,
      onPageSelected,
      onPageScrollStateChanged,
    },
    ref,
  ) {
    const native = useNativeColors();
    const pagerRef = useRef<PagerViewRef>(null);
    const pageMargin = semantic.space.stack.compact;
    const pagerStyle = useMemo(
      () => ({ flex: 1, backgroundColor: native.surface.default }),
      [native],
    );

    useImperativeHandle(
      ref,
      () => ({
        setPage: (index: number) => {
          pagerRef.current?.setPage(index);
        },
        setPageWithoutAnimation: (index: number) => {
          pagerRef.current?.setPageWithoutAnimation(index);
        },
      }),
      [],
    );

    const pages = useMemo(
      () =>
        weeks.map((weekStartKey, index) => {
          const shouldRender =
            Math.abs(index - pageIndex) <= MONTH_VIEW_PAGER_RENDER_RADIUS;
          const focusMonth = focusMonthForWeek(weekStartKey);
          const monthKey = toMonthKey(focusMonth);
          return (
            <View
              key={weekStartKey}
              collapsable={false}
              className="flex-1"
            >
              {shouldRender ? (
                <MonthWeekStrip
                  weekStartKey={weekStartKey}
                  eventsByDay={monthEventsSlice(appointmentsCache, monthKey)}
                  prevMonthEventsByDay={monthEventsSlice(
                    appointmentsCache,
                    toMonthKey(addMonths(focusMonth, -1)),
                  )}
                  nextMonthEventsByDay={monthEventsSlice(
                    appointmentsCache,
                    toMonthKey(addMonths(focusMonth, 1)),
                  )}
                  eventIndicators={eventIndicators}
                  onDayPress={onDayPress}
                />
              ) : (
                <View className="flex-1" />
              )}
            </View>
          );
        }),
      [appointmentsCache, eventIndicators, onDayPress, pageIndex, weeks],
    );

    return (
      <PagerView
        ref={pagerRef}
        style={pagerStyle}
        initialPage={initialIndex}
        scrollEnabled={scrollEnabled}
        offscreenPageLimit={MONTH_VIEW_PAGER_RENDER_RADIUS}
        pageMargin={pageMargin}
        onPageSelected={onPageSelected}
        onPageScrollStateChanged={onPageScrollStateChanged}
      >
        {pages}
      </PagerView>
    );
  },
);

export const MonthWeekPager = memo(MonthWeekPagerInner);
