import React, { useEffect } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/ui";
import { useMonthAppointmentsCache } from "@/hooks/schedule/useMonthAppointmentsCache";
import { useVisibleMonth } from "@/hooks/schedule/useVisibleMonth";
import { useThemeTokens } from "@/theme";
import { toMonthKey, toYearMonth, type WeekdayIndex } from "@/utils/calendar";

import { MonthCalendarHeader } from "./MonthCalendarHeader";
import { MonthPager } from "./MonthPager";
import { WeekdayHeader } from "./WeekdayHeader";

export type MonthCalendarProps = {
  weekStartsOn?: WeekdayIndex;
};

/**
 * Full-screen month calendar with horizontal paging.
 * Step 6: WatermelonDB cache for ±1 month (debug overlay; grid paint is Step 7).
 */
export function MonthCalendar({ weekStartsOn = 0 }: MonthCalendarProps) {
  const theme = useThemeTokens();
  const centerMonth = toYearMonth(new Date());
  const {
    months,
    initialIndex,
    pageIndex,
    visibleMonth,
    isDragging,
    onPageSelected,
    onPageScrollStateChanged,
  } = useVisibleMonth(centerMonth);

  const {
    loadedMonthKeys,
    ensureVisibleWindow,
    getEventCountForMonth,
  } = useMonthAppointmentsCache({
    fallbackColor: theme.palette.brand.default,
    isDragging,
  });

  useEffect(() => {
    ensureVisibleWindow(visibleMonth);
  }, [ensureVisibleWindow, visibleMonth]);

  const debugLine =
    loadedMonthKeys.length === 0
      ? "Cache: (loading…)"
      : `Cache: ${loadedMonthKeys
          .map((key) => `${key}(${getEventCountForMonth(key)})`)
          .join(" · ")}`;

  return (
    <View
      style={{
        flex: 1,
        width: "100%",
        alignSelf: "stretch",
      }}
    >
      <MonthCalendarHeader yearMonth={visibleMonth} />
      <WeekdayHeader weekStartsOn={weekStartsOn} />
      <ThemedText tone="muted" variant="label" style={{ marginBottom: 6 }}>
        {debugLine}
        {isDragging ? " · dragging" : ""}
        {` · focus ${toMonthKey(visibleMonth)}`}
      </ThemedText>
      <MonthPager
        months={months}
        initialIndex={initialIndex}
        pageIndex={pageIndex}
        weekStartsOn={weekStartsOn}
        onPageSelected={onPageSelected}
        onPageScrollStateChanged={onPageScrollStateChanged}
      />
    </View>
  );
}
