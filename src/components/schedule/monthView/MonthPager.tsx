import React from "react";
import { View } from "react-native";
import PagerView from "react-native-pager-view";

import {
  toMonthKey,
  type DayKey,
  type WeekdayIndex,
  type YearMonth,
} from "@/utils/calendar";

import { MonthGrid } from "./MonthGrid";

export type MonthPagerProps = {
  months: YearMonth[];
  initialIndex: number;
  pageIndex: number;
  weekStartsOn?: WeekdayIndex;
  selectedDayKey?: DayKey | null;
  onDayPress?: (dayKey: DayKey) => void;
  onPageSelected: MonthPagerOnPageSelected;
};

type MonthPagerOnPageSelected = React.ComponentProps<
  typeof PagerView
>["onPageSelected"];

/** How many neighbor pages keep a mounted MonthGrid. */
const RENDER_RADIUS = 1;

/**
 * Horizontal snapped month pages. Grids are empty of events in Step 3;
 * only nearby pages mount a real MonthGrid for scroll performance.
 */
export function MonthPager({
  months,
  initialIndex,
  pageIndex,
  weekStartsOn = 0,
  selectedDayKey = null,
  onDayPress,
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
                selectedDayKey={selectedDayKey}
                eventsByDay={{}}
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
}
