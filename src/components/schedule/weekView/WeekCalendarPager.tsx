import { memo, useCallback, useMemo } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import PagerView from "react-native-pager-view";
import { semantic } from "@/tokens";

import { WEEK_VIEW_PAGER_RENDER_RADIUS } from "@/constants/schedule";
import type { WeekEventsByDay } from "@/hooks/schedule/useWeekAppointmentsCache";
import { useWeekViewAxisLock } from "@/hooks/schedule/useWeekViewAxisLock";
import { useAddAppointmentStore } from "@/stores/addAppointmentStore";
import type { DayPressHandler } from "@/types/schedule";
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
  onDayPress?: DayPressHandler;
  onDayHeaderLayout?: (event: LayoutChangeEvent) => void;
  /** When true, time-grid vertical scroll is disabled so sheet dismiss owns the pan. */
  sheetOpen?: boolean;
};

type WeekPageProps = {
  weekStartKey: DayKey;
  weekStartsOn: WeekdayIndex;
  gutterWidth: number;
  eventsByDay: WeekEventsByDay;
  sheetOpen: boolean;
  measureHeader: boolean;
  onDayPress?: DayPressHandler;
  onDayHeaderLayout?: (event: LayoutChangeEvent) => void;
  gridTouchHandlers: ReturnType<typeof useWeekViewAxisLock>["gridTouchHandlers"];
  lockPagerForVerticalScroll: () => void;
  resetAxisLock: () => void;
};

const WeekPage = memo(function WeekPage({
  weekStartKey,
  weekStartsOn,
  gutterWidth,
  eventsByDay,
  sheetOpen,
  measureHeader,
  onDayPress,
  onDayHeaderLayout,
  gridTouchHandlers,
  lockPagerForVerticalScroll,
  resetAxisLock,
}: WeekPageProps) {
  return (
    <View collapsable={false} style={{ flex: 1 }}>
      {/*
        Header stays outside any gesture wrapper so width/layout stay stable
        and day presses are not delayed by a competing pan recognizer.
      */}
      <WeekDayHeaderRow
        weekStartKey={weekStartKey}
        weekStartsOn={weekStartsOn}
        gutterWidth={gutterWidth}
        onDayPress={onDayPress}
        onLayout={measureHeader ? onDayHeaderLayout : undefined}
        useHighlightContext
      />
      <View
        style={{ flex: 1 }}
        {...(sheetOpen ? {} : gridTouchHandlers)}
        pointerEvents={sheetOpen ? "none" : "auto"}
      >
        <WeekTimeGrid
          weekStartKey={weekStartKey}
          eventsByDay={eventsByDay}
          gutterWidth={gutterWidth}
          onVerticalScrollBegin={
            sheetOpen ? undefined : lockPagerForVerticalScroll
          }
          onVerticalScrollEnd={sheetOpen ? undefined : resetAxisLock}
        />
      </View>
    </View>
  );
});

function WeekCalendarPagerComponent({
  weeks,
  initialIndex,
  pageIndex,
  weekStartsOn = 0,
  gutterWidth,
  getEventsForWeek,
  onPageSelected,
  onPageScrollStateChanged,
  onDayPress,
  onDayHeaderLayout,
  sheetOpen = false,
}: WeekCalendarPagerProps) {
  const pageMargin = semantic.space.stack.compact;
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
          <View key={weekStartKey} collapsable={false} style={{ flex: 1 }}>
            {shouldRender ? (
              <WeekPage
                weekStartKey={weekStartKey}
                weekStartsOn={weekStartsOn}
                gutterWidth={gutterWidth}
                eventsByDay={getEventsForWeek(weekStartKey)}
                sheetOpen={sheetOpen}
                measureHeader={index === pageIndex}
                onDayPress={onDayPress}
                onDayHeaderLayout={onDayHeaderLayout}
                gridTouchHandlers={gridTouchHandlers}
                lockPagerForVerticalScroll={lockPagerForVerticalScroll}
                resetAxisLock={resetAxisLock}
              />
            ) : (
              <View style={{ flex: 1 }} />
            )}
          </View>
        );
      }),
    [
      getEventsForWeek,
      gridTouchHandlers,
      gutterWidth,
      lockPagerForVerticalScroll,
      onDayHeaderLayout,
      onDayPress,
      pageIndex,
      resetAxisLock,
      sheetOpen,
      weekStartsOn,
      weeks,
    ],
  );

  return (
    <PagerView
      style={{ flex: 1 }}
      initialPage={initialIndex}
      scrollEnabled={sheetOpen ? true : pagerScrollEnabled}
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
