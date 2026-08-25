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

import type { MonthAppointmentsCache } from "@/hooks/schedule/useMonthAppointmentsCache";
import { monthEventsSlice } from "@/helpers/scheduleEvents";
import { useThemeTokens } from "@/theme";
import {
  addMonths,
  toMonthKey,
  type WeekdayIndex,
  type YearMonth,
} from "@/utils/calendar";

import { MONTH_VIEW_PAGER_RENDER_RADIUS } from "@/constants/schedule";
import type { DayPressHandler, MonthPagerHandle } from "@/types/schedule";

import { MonthGrid } from "./MonthGrid";

export type { MonthPagerHandle };

export type MonthPagerProps = {
  months: YearMonth[];
  initialIndex: number;
  pageIndex: number;
  weekStartsOn?: WeekdayIndex;
  appointmentsCache?: MonthAppointmentsCache;
  scrollEnabled?: boolean;
  onDayPress?: DayPressHandler;
  onPageScroll?: MonthPagerOnPageScroll;
  onPageSelected: MonthPagerOnPageSelected;
  onPageScrollStateChanged?: MonthPagerOnPageScrollStateChanged;
};

type MonthPagerOnPageScroll = NonNullable<
  React.ComponentProps<typeof PagerView>["onPageScroll"]
>;
type MonthPagerOnPageSelected = NonNullable<
  React.ComponentProps<typeof PagerView>["onPageSelected"]
>;
type MonthPagerOnPageScrollStateChanged = NonNullable<
  React.ComponentProps<typeof PagerView>["onPageScrollStateChanged"]
>;

type PagerViewRef = ComponentRef<typeof PagerView>;

/**
 * Horizontal snapped month pages.
 * Only nearby pages mount a real MonthGrid for scroll performance.
 * Each grid receives only its month (+ neighbor) day maps so cache writes
 * to other months keep stable props for memoized grids.
 */
const MonthPagerInner = forwardRef<MonthPagerHandle, MonthPagerProps>(
  function MonthPagerInner(
    {
      months,
      initialIndex,
      pageIndex,
      weekStartsOn = 0,
      appointmentsCache = {},
      scrollEnabled = true,
      onDayPress,
      onPageScroll,
      onPageSelected,
      onPageScrollStateChanged,
    },
    ref,
  ) {
    const theme = useThemeTokens();
    const pagerRef = useRef<PagerViewRef>(null);
    const pageMargin = theme.semantic.space.stack.compact;

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
        months.map((yearMonth, index) => {
          const shouldRender =
            Math.abs(index - pageIndex) <= MONTH_VIEW_PAGER_RENDER_RADIUS;
          const monthKey = toMonthKey(yearMonth);
          return (
            <View
              key={monthKey}
              collapsable={false}
              className="flex-1"
            >
              {shouldRender ? (
                <MonthGrid
                  yearMonth={yearMonth}
                  weekStartsOn={weekStartsOn}
                  eventsByDay={monthEventsSlice(appointmentsCache, monthKey)}
                  prevMonthEventsByDay={monthEventsSlice(
                    appointmentsCache,
                    toMonthKey(addMonths(yearMonth, -1)),
                  )}
                  nextMonthEventsByDay={monthEventsSlice(
                    appointmentsCache,
                    toMonthKey(addMonths(yearMonth, 1)),
                  )}
                  onDayPress={onDayPress}
                />
              ) : (
                <View className="flex-1" />
              )}
            </View>
          );
        }),
      [appointmentsCache, months, onDayPress, pageIndex, weekStartsOn],
    );

    return (
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={initialIndex}
        scrollEnabled={scrollEnabled}
        offscreenPageLimit={MONTH_VIEW_PAGER_RENDER_RADIUS}
        pageMargin={pageMargin}
        onPageScroll={onPageScroll}
        onPageSelected={onPageSelected}
        onPageScrollStateChanged={onPageScrollStateChanged}
      >
        {pages}
      </PagerView>
    );
  },
);

export const MonthPager = memo(MonthPagerInner);
