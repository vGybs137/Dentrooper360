import { memo, useMemo } from "react";
import { View } from "react-native";
import PagerView from "react-native-pager-view";

import { DAY_VIEW_PAGER_RENDER_RADIUS } from "@/constants/schedule";
import { useThemeTokens } from "@/theme";
import type { DayKey } from "@/utils/calendar";

import { DayTimeGrid } from "./DayTimeGrid";

export type DayCalendarPagerProps = {
  days: DayKey[];
  initialIndex: number;
  pageIndex: number;
  gutterWidth: number;
  onPageSelected: NonNullable<
    React.ComponentProps<typeof PagerView>["onPageSelected"]
  >;
  onPageScrollStateChanged?: NonNullable<
    React.ComponentProps<typeof PagerView>["onPageSelected"]
  >;
};

function DayCalendarPagerComponent({
  days,
  initialIndex,
  pageIndex,
  gutterWidth,
  onPageSelected,
  onPageScrollStateChanged,
}: DayCalendarPagerProps) {
  const theme = useThemeTokens();
  const pageMargin = theme.semantic.space.stack.compact;

  const pages = useMemo(
    () =>
      days.map((dayKey, index) => {
        const shouldRender =
          Math.abs(index - pageIndex) <= DAY_VIEW_PAGER_RENDER_RADIUS;
        return (
          <View key={dayKey} collapsable={false} className="flex-1">
            {shouldRender ? (
              <DayTimeGrid dayKey={dayKey} gutterWidth={gutterWidth} />
            ) : (
              <View className="flex-1" />
            )}
          </View>
        );
      }),
    [days, gutterWidth, pageIndex],
  );

  return (
    <PagerView
      style={{ flex: 1 }}
      initialPage={initialIndex}
      offscreenPageLimit={DAY_VIEW_PAGER_RENDER_RADIUS}
      pageMargin={pageMargin}
      onPageSelected={onPageSelected}
      onPageScrollStateChanged={onPageScrollStateChanged}
    >
      {pages}
    </PagerView>
  );
}

export const DayCalendarPager = memo(DayCalendarPagerComponent);
