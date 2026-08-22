import { memo, useCallback, useMemo } from "react";
import { View } from "react-native";
import PagerView from "react-native-pager-view";

import { WEEK_VIEW_PAGER_RENDER_RADIUS } from "@/constants/schedule";
import type { WeekEventsByDay } from "@/hooks/schedule/useWeekAppointmentsCache";
import { useWeekViewAxisLock } from "@/hooks/schedule/useWeekViewAxisLock";
import { useAddAppointmentStore } from "@/stores/addAppointmentStore";
import { useThemeTokens } from "@/theme";
import type { DayKey, WeekdayIndex } from "@/utils/calendar";

import { WeekDayHeaderRow } from "./WeekDayHeaderRow";
import { WeekTimeGrid } from "./WeekTimeGrid";

export type WeekCalendarPagerProps = {
  weeks: DayKey[];
  initialIndex: number;
  pageIndex: number;
  weekStartsOn?: WeekdayIndex;
  gutterWidth: number;
  getEventsForWeek: (weekStartKey: DayKey) => WeekEventsByDay;
  onPageSelected: NonNullable<
    React.ComponentProps<typeof PagerView>["onPageSelected"]
  >;
  onPageScrollStateChanged?: NonNullable<
    React.ComponentProps<typeof PagerView>["onPageScrollStateChanged"]
  >;
};

function WeekCalendarPagerComponent({
  weeks,
  initialIndex,
  pageIndex,
  weekStartsOn = 0,
  gutterWidth,
  getEventsForWeek,
  onPageSelected,
  onPageScrollStateChanged,
}: WeekCalendarPagerProps) {
  const theme = useThemeTokens();
  const pageMargin = theme.semantic.space.stack.compact;
  const {
    pagerScrollEnabled,
    gridTouchHandlers,
    lockPagerForVerticalScroll,
    resetAxisLock,
  } = useWeekViewAxisLock();

  const clearOrCloseAddAppointment = useAddAppointmentStore(
    (state) => state.clearOrClose,
  );

  const handlePageSelected = useCallback<
    NonNullable<React.ComponentProps<typeof PagerView>["onPageSelected"]>
  >(
    (event) => {
      clearOrCloseAddAppointment();
      onPageSelected(event);
    },
    [clearOrCloseAddAppointment, onPageSelected],
  );

  const pages = useMemo(
    () =>
      weeks.map((weekStartKey, index) => {
        const shouldRender =
          Math.abs(index - pageIndex) <= WEEK_VIEW_PAGER_RENDER_RADIUS;
        return (
          <View key={weekStartKey} collapsable={false} className="flex-1">
            {shouldRender ? (
              <>
                <WeekDayHeaderRow
                  weekStartKey={weekStartKey}
                  weekStartsOn={weekStartsOn}
                  gutterWidth={gutterWidth}
                />
                <View className="flex-1" {...gridTouchHandlers}>
                  <WeekTimeGrid
                    weekStartKey={weekStartKey}
                    eventsByDay={getEventsForWeek(weekStartKey)}
                    gutterWidth={gutterWidth}
                    onVerticalScrollBegin={lockPagerForVerticalScroll}
                    onVerticalScrollEnd={resetAxisLock}
                  />
                </View>
              </>
            ) : (
              <View className="flex-1" />
            )}
          </View>
        );
      }),
    [getEventsForWeek, gridTouchHandlers, gutterWidth, lockPagerForVerticalScroll, pageIndex, resetAxisLock, weekStartsOn, weeks],
  );

  return (
    <PagerView
      style={{ flex: 1 }}
      initialPage={initialIndex}
      scrollEnabled={pagerScrollEnabled}
      offscreenPageLimit={WEEK_VIEW_PAGER_RENDER_RADIUS}
      pageMargin={pageMargin}
      onPageSelected={handlePageSelected}
      onPageScrollStateChanged={onPageScrollStateChanged}
    >
      {pages}
    </PagerView>
  );
}

export const WeekCalendarPager = memo(WeekCalendarPagerComponent);
