import React, {
  forwardRef,
  memo,
  useImperativeHandle,
  useRef,
  type ComponentRef,
} from "react";
import { View } from "react-native";
import PagerView from "react-native-pager-view";
import Animated from "react-native-reanimated";
import { semantic } from "@/tokens";

import type { MonthAppointmentsCache } from "@/hooks/schedule/useMonthAppointmentsCache";
import type { usePagerScrollHandler } from "@/hooks/schedule/usePagerScrollHandler";
import { monthEventsSlice } from "@/helpers/schedule/scheduleEvents";
import {
  addMonths,
  toMonthKey,
  type WeekdayIndex,
  type YearMonth,
} from "@/helpers/schedule/calendar";

import { MONTH_VIEW_PAGER_RENDER_RADIUS } from "@/constants/schedule";
import type { DayPressHandler, MonthPagerHandle } from "@/types/schedule";
import type { DayCellEventIndicators } from "./DayCell";

import { MonthGrid } from "./MonthGrid";

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

export type { MonthPagerHandle };

export type MonthPagerProps = {
  months: YearMonth[];
  initialIndex: number;
  pageIndex: number;
  weekStartsOn?: WeekdayIndex;
  appointmentsCache?: MonthAppointmentsCache;
  eventIndicators?: DayCellEventIndicators;
  scrollEnabled?: boolean;
  onDayPress?: DayPressHandler;
  pageScrollHandler: ReturnType<typeof usePagerScrollHandler>;
  onPageSelected: MonthPagerOnPageSelected;
  onPageScrollStateChanged?: MonthPagerOnPageScrollStateChanged;
};

type MonthPagerOnPageSelected = NonNullable<
  React.ComponentProps<typeof PagerView>["onPageSelected"]
>;
type MonthPagerOnPageScrollStateChanged = NonNullable<
  React.ComponentProps<typeof PagerView>["onPageScrollStateChanged"]
>;

type PagerViewRef = ComponentRef<typeof PagerView>;

type MonthPagerPageProps = {
  index: number;
  renderCenter: number;
  yearMonth: YearMonth;
  weekStartsOn: WeekdayIndex;
  appointmentsCache: MonthAppointmentsCache;
  eventIndicators: DayCellEventIndicators;
  onDayPress?: DayPressHandler;
};

function shouldRenderPage(index: number, renderCenter: number): boolean {
  return Math.abs(index - renderCenter) <= MONTH_VIEW_PAGER_RENDER_RADIUS;
}

function MonthPagerPage({
  index,
  renderCenter,
  yearMonth,
  weekStartsOn,
  appointmentsCache,
  eventIndicators,
  onDayPress,
}: MonthPagerPageProps) {
  const shouldRender = shouldRenderPage(index, renderCenter);
  const monthKey = toMonthKey(yearMonth);

  return (
    <View collapsable={false} className="flex-1">
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
          eventIndicators={eventIndicators}
          onDayPress={onDayPress}
        />
      ) : (
        <View className="flex-1" />
      )}
    </View>
  );
}

function monthPagerPagePropsEqual(
  prev: MonthPagerPageProps,
  next: MonthPagerPageProps,
): boolean {
  const prevVisible = shouldRenderPage(prev.index, prev.renderCenter);
  const nextVisible = shouldRenderPage(next.index, next.renderCenter);
  if (prevVisible !== nextVisible) return false;
  if (!nextVisible) return true;

  return (
    prev.yearMonth === next.yearMonth &&
    prev.weekStartsOn === next.weekStartsOn &&
    prev.eventIndicators === next.eventIndicators &&
    prev.onDayPress === next.onDayPress &&
    prev.appointmentsCache === next.appointmentsCache
  );
}

const MemoMonthPagerPage = memo(MonthPagerPage, monthPagerPagePropsEqual);

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
      eventIndicators = "chips",
      scrollEnabled = true,
      onDayPress,
      pageScrollHandler,
      onPageSelected,
      onPageScrollStateChanged,
    },
    ref,
  ) {
    const pagerRef = useRef<PagerViewRef>(null);
    const pageMargin = semantic.space.stack.compact;

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

    return (
      <AnimatedPagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={initialIndex}
        scrollEnabled={scrollEnabled}
        offscreenPageLimit={MONTH_VIEW_PAGER_RENDER_RADIUS}
        pageMargin={pageMargin}
        onPageScroll={pageScrollHandler}
        onPageSelected={onPageSelected}
        onPageScrollStateChanged={onPageScrollStateChanged}
      >
        {months.map((yearMonth, index) => (
          <MemoMonthPagerPage
            key={toMonthKey(yearMonth)}
            index={index}
            renderCenter={pageIndex}
            yearMonth={yearMonth}
            weekStartsOn={weekStartsOn}
            appointmentsCache={appointmentsCache}
            eventIndicators={eventIndicators}
            onDayPress={onDayPress}
          />
        ))}
      </AnimatedPagerView>
    );
  },
);

export const MonthPager = memo(MonthPagerInner);
