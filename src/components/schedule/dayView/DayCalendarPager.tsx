import { memo, useCallback, useMemo } from "react";
import { View } from "react-native";
import PagerView from "react-native-pager-view";

import { DAY_VIEW_PAGER_RENDER_RADIUS } from "@/constants/schedule";
import { useWeekViewAxisLock } from "@/hooks/schedule/useWeekViewAxisLock";
import { useAddAppointmentStore } from "@/stores/addAppointmentStore";
import { useThemeTokens } from "@/theme";
import type { MonthDayEventPreview } from "@/types/schedule";
import type { DayKey } from "@/utils/calendar";

import { DayPageHeaderRow } from "./DayPageHeaderRow";
import { DayTimeGrid } from "./DayTimeGrid";

export type DayCalendarPagerProps = {
  days: DayKey[];
  initialIndex: number;
  pageIndex: number;
  gutterWidth: number;
  getEventsForDay: (dayKey: DayKey) => MonthDayEventPreview[];
  onPageSelected: NonNullable<
    React.ComponentProps<typeof PagerView>["onPageSelected"]
  >;
  onPageScrollStateChanged?: NonNullable<
    React.ComponentProps<typeof PagerView>["onPageScrollStateChanged"]
  >;
};

function DayCalendarPagerComponent({
  days,
  initialIndex,
  pageIndex,
  gutterWidth,
  getEventsForDay,
  onPageSelected,
  onPageScrollStateChanged,
}: DayCalendarPagerProps) {
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
      days.map((dayKey, index) => {
        const shouldRender =
          Math.abs(index - pageIndex) <= DAY_VIEW_PAGER_RENDER_RADIUS;
        return (
          <View key={dayKey} collapsable={false} className="flex-1">
            {shouldRender ? (
              <>
                <DayPageHeaderRow dayKey={dayKey} gutterWidth={gutterWidth} />
                <View className="flex-1" {...gridTouchHandlers}>
                  <DayTimeGrid
                    dayKey={dayKey}
                    events={getEventsForDay(dayKey)}
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
    [
      days,
      getEventsForDay,
      gridTouchHandlers,
      gutterWidth,
      lockPagerForVerticalScroll,
      pageIndex,
      resetAxisLock,
    ],
  );

  return (
    <PagerView
      style={{ flex: 1 }}
      initialPage={initialIndex}
      scrollEnabled={pagerScrollEnabled}
      offscreenPageLimit={DAY_VIEW_PAGER_RENDER_RADIUS}
      pageMargin={pageMargin}
      onPageSelected={handlePageSelected}
      onPageScrollStateChanged={onPageScrollStateChanged}
    >
      {pages}
    </PagerView>
  );
}

export const DayCalendarPager = memo(DayCalendarPagerComponent);
