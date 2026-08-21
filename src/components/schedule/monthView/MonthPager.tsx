import React from "react";
import { View } from "react-native";
import PagerView from "react-native-pager-view";

import type { MonthAppointmentsCache } from "@/hooks/schedule/useMonthAppointmentsCache";
import {
  toMonthKey,
  type WeekdayIndex,
  type YearMonth,
} from "@/utils/calendar";

import { MonthGrid } from "./MonthGrid";

export type MonthPagerProps = {
  months: YearMonth[];
  initialIndex: number;
  pageIndex: number;
  weekStartsOn?: WeekdayIndex;
  appointmentsCache?: MonthAppointmentsCache;
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

/**
 * Horizontal snapped month pages.
 * Only nearby pages mount a real MonthGrid for scroll performance.
 * Owns horizontal paging; day sheet open gesture uses failOffsetX so X wins on conflict.
 */
export function MonthPager({
  months,
  initialIndex,
  pageIndex,
  weekStartsOn = 0,
  appointmentsCache = {},
  onPageSelected,
  onPageScrollStateChanged,
}: MonthPagerProps) {
  return (
    <PagerView
      style={{ flex: 1 }}
      initialPage={initialIndex}
      offscreenPageLimit={RENDER_RADIUS}
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
              />
            ) : (
              <View style={{ flex: 1 }} />
            )}
          </View>
        );
      })}
    </PagerView>
  );
}
