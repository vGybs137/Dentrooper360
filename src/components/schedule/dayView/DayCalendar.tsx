import { View } from "react-native";

import { WEEK_VIEW_GUTTER_WIDTH } from "@/constants/schedule";
import { useVisibleDay } from "@/hooks/schedule/useVisibleDay";

import { DayCalendarHeader } from "./DayCalendarHeader";
import { DayCalendarPager } from "./DayCalendarPager";

/** Day view shell — header and horizontally paged timed grids. */
export function DayCalendar() {
  const {
    days,
    initialIndex,
    pageIndex,
    visibleDayKey,
    onPageSelected,
    onPageScrollStateChanged,
  } = useVisibleDay();

  return (
    <View className="w-full flex-1 self-stretch">
      <DayCalendarHeader dayKey={visibleDayKey} />
      <DayCalendarPager
        days={days}
        initialIndex={initialIndex}
        pageIndex={pageIndex}
        gutterWidth={WEEK_VIEW_GUTTER_WIDTH}
        onPageSelected={onPageSelected}
        onPageScrollStateChanged={onPageScrollStateChanged}
      />
    </View>
  );
}
