import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ComponentRef,
} from "react";
import { View } from "react-native";
import PagerView from "react-native-pager-view";

import type { MonthAppointmentsCache } from "@/hooks/schedule/useMonthAppointmentsCache";
import { useThemeTokens } from "@/theme";
import {
  toMonthKey,
  type DayKey,
  type WeekdayIndex,
  type YearMonth,
} from "@/utils/calendar";

import { MonthGrid } from "./MonthGrid";

export type MonthPagerHandle = {
  setPage: (index: number) => void;
};

export type MonthPagerProps = {
  months: YearMonth[];
  initialIndex: number;
  pageIndex: number;
  weekStartsOn?: WeekdayIndex;
  appointmentsCache?: MonthAppointmentsCache;
  onDayPress?: (dayKey: DayKey, alreadySelected: boolean) => void;
  onPageSelected: MonthPagerOnPageSelected;
  onPageScrollStateChanged?: MonthPagerOnPageScrollStateChanged;
};

type MonthPagerOnPageSelected = NonNullable<
  React.ComponentProps<typeof PagerView>["onPageSelected"]
>;
type MonthPagerOnPageScrollStateChanged = NonNullable<
  React.ComponentProps<typeof PagerView>["onPageScrollStateChanged"]
>;

/** How many neighbor pages keep a mounted MonthGrid. */
const RENDER_RADIUS = 1;

type PagerViewRef = ComponentRef<typeof PagerView>;

/**
 * Horizontal snapped month pages.
 * Only nearby pages mount a real MonthGrid for scroll performance.
 */
export const MonthPager = forwardRef<MonthPagerHandle, MonthPagerProps>(
  function MonthPager(
    {
      months,
      initialIndex,
      pageIndex,
      weekStartsOn = 0,
      appointmentsCache = {},
      onDayPress,
      onPageSelected,
      onPageScrollStateChanged,
    },
    ref,
  ) {
    const theme = useThemeTokens();
    const pagerRef = useRef<PagerViewRef>(null);
    // Gap between adjacent months while swiping (matches in-grid cell spacing feel).
    const pageMargin = theme.semantic.space.stack.compact;

    useImperativeHandle(
      ref,
      () => ({
        setPage: (index: number) => {
          pagerRef.current?.setPage(index);
        },
      }),
      [],
    );

    return (
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={initialIndex}
        offscreenPageLimit={RENDER_RADIUS}
        pageMargin={pageMargin}
        onPageSelected={onPageSelected}
        onPageScrollStateChanged={onPageScrollStateChanged}
      >
        {months.map((yearMonth, index) => {
          const shouldRender = Math.abs(index - pageIndex) <= RENDER_RADIUS;

          return (
            <View
              key={toMonthKey(yearMonth)}
              collapsable={false}
              style={{ flex: 1 }}
            >
              {shouldRender ? (
                <MonthGrid
                  yearMonth={yearMonth}
                  weekStartsOn={weekStartsOn}
                  appointmentsCache={appointmentsCache}
                  onDayPress={onDayPress}
                />
              ) : (
                <View style={{ flex: 1 }} />
              )}
            </View>
          );
        })}
      </PagerView>
    );
  },
);
