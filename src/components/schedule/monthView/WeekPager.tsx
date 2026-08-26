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
  focusMonthForWeek,
  toMonthKey,
  type DayKey,
} from "@/utils/calendar";

import { MONTH_VIEW_PAGER_RENDER_RADIUS } from "@/constants/schedule";
import type { DayPressHandler, WeekPagerHandle } from "@/types/schedule";
import type { DayCellEventIndicators } from "./DayCell";

import { WeekStrip } from "./WeekStrip";

export type { WeekPagerHandle };

export type WeekPagerProps = {
  weeks: DayKey[];
  initialIndex: number;
  pageIndex: number;
  appointmentsCache?: MonthAppointmentsCache;
  eventIndicators?: DayCellEventIndicators;
  scrollEnabled?: boolean;
  onDayPress?: DayPressHandler;
  onPageSelected: WeekPagerOnPageSelected;
  onPageScrollStateChanged?: WeekPagerOnPageScrollStateChanged;
};

type WeekPagerOnPageSelected = NonNullable<
  React.ComponentProps<typeof PagerView>["onPageSelected"]
>;
type WeekPagerOnPageScrollStateChanged = NonNullable<
  React.ComponentProps<typeof PagerView>["onPageScrollStateChanged"]
>;

type PagerViewRef = ComponentRef<typeof PagerView>;

/**
 * Horizontal snapped week pages (sheet-open mode).
 * Only nearby pages mount a real WeekStrip for scroll performance.
 * Each strip receives focus-month (+ neighbor) day maps only.
 */
const WeekPagerInner = forwardRef<WeekPagerHandle, WeekPagerProps>(
  function WeekPagerInner(
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
                <WeekStrip
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
        style={{ flex: 1 }}
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

export const WeekPager = memo(WeekPagerInner);
