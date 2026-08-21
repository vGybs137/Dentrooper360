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
import { useThemeTokens } from "@/theme";
import {
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
          return (
            <View
              key={toMonthKey(yearMonth)}
              collapsable={false}
              className="flex-1"
            >
              {shouldRender ? (
                <MonthGrid
                  yearMonth={yearMonth}
                  weekStartsOn={weekStartsOn}
                  appointmentsCache={appointmentsCache}
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
