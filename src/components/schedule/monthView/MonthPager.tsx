import React from "react";
import { View } from "react-native";
import PagerView from "react-native-pager-view";

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
  onPageSelected: MonthPagerOnPageSelected;
};

type MonthPagerOnPageSelected = React.ComponentProps<
  typeof PagerView
>["onPageSelected"];

/** How many neighbor pages keep a mounted MonthGrid. */
const RENDER_RADIUS = 1;

/**
 * Horizontal snapped month pages.
 * Only nearby pages mount a real MonthGrid for scroll performance.
 */
export function MonthPager({
  months,
  initialIndex,
  pageIndex,
  weekStartsOn = 0,
  onPageSelected,
}: MonthPagerProps) {
  return (
    <PagerView
      style={{ flex: 1 }}
      initialPage={initialIndex}
      offscreenPageLimit={RENDER_RADIUS}
      onPageSelected={onPageSelected}
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
                eventsByDay={{}}
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
