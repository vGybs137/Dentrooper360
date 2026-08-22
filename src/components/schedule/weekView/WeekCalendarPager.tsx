import { memo, useMemo } from "react";
import { View } from "react-native";
import PagerView from "react-native-pager-view";

import { WEEK_VIEW_PAGER_RENDER_RADIUS } from "@/constants/schedule";
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
  onPageSelected,
  onPageScrollStateChanged,
}: WeekCalendarPagerProps) {
  const theme = useThemeTokens();
  const pageMargin = theme.semantic.space.stack.compact;

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
                <WeekTimeGrid
                  weekStartKey={weekStartKey}
                  gutterWidth={gutterWidth}
                />
              </>
            ) : (
              <View className="flex-1" />
            )}
          </View>
        );
      }),
    [gutterWidth, pageIndex, weekStartsOn, weeks],
  );

  return (
    <PagerView
      style={{ flex: 1 }}
      initialPage={initialIndex}
      offscreenPageLimit={WEEK_VIEW_PAGER_RENDER_RADIUS}
      pageMargin={pageMargin}
      onPageSelected={onPageSelected}
      onPageScrollStateChanged={onPageScrollStateChanged}
    >
      {pages}
    </PagerView>
  );
}

export const WeekCalendarPager = memo(WeekCalendarPagerComponent);
