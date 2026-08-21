import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ComponentRef,
} from "react";
import { View } from "react-native";
import PagerView from "react-native-pager-view";

import type { MonthAppointmentsCache } from "@/hooks/schedule/useMonthAppointmentsCache";
import { useThemeTokens } from "@/theme";
import type { DayKey } from "@/utils/calendar";

import { WeekStrip } from "./WeekStrip";

export type WeekPagerHandle = {
  setPage: (index: number) => void;
  setPageWithoutAnimation: (index: number) => void;
};

export type WeekPagerProps = {
  weeks: DayKey[];
  initialIndex: number;
  pageIndex: number;
  appointmentsCache?: MonthAppointmentsCache;
  scrollEnabled?: boolean;
  onDayPress?: (dayKey: DayKey, alreadySelected: boolean) => void;
  onPageSelected: WeekPagerOnPageSelected;
  onPageScrollStateChanged?: WeekPagerOnPageScrollStateChanged;
};

type WeekPagerOnPageSelected = NonNullable<
  React.ComponentProps<typeof PagerView>["onPageSelected"]
>;
type WeekPagerOnPageScrollStateChanged = NonNullable<
  React.ComponentProps<typeof PagerView>["onPageScrollStateChanged"]
>;

/** How many neighbor week pages keep a mounted WeekStrip. */
const RENDER_RADIUS = 1;

type PagerViewRef = ComponentRef<typeof PagerView>;

/**
 * Horizontal snapped week pages (sheet-open mode).
 * Only nearby pages mount a real WeekStrip for scroll performance.
 */
export const WeekPager = forwardRef<WeekPagerHandle, WeekPagerProps>(
  function WeekPager(
    {
      weeks,
      initialIndex,
      pageIndex,
      appointmentsCache = {},
      scrollEnabled = true,
      onDayPress,
      onPageSelected,
      onPageScrollStateChanged,
    },
    ref,
  ) {
    const theme = useThemeTokens();
    const pagerRef = useRef<PagerViewRef>(null);
    const pageMargin = theme.semantic.space.stack.compact;

    useImperativeHandle(
      ref,
      () => ({
        setPage: (index: number) => {
          pagerRef.current?.setPage(index);
        },
        setPageWithoutAnimation: (index: number) => {
          pagerRef.current?.setPageWithoutAnimation(index);
        },
      }),
      [],
    );

    return (
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={initialIndex}
        scrollEnabled={scrollEnabled}
        offscreenPageLimit={RENDER_RADIUS}
        pageMargin={pageMargin}
        onPageSelected={onPageSelected}
        onPageScrollStateChanged={onPageScrollStateChanged}
      >
        {weeks.map((weekStartKey, index) => {
          const shouldRender = Math.abs(index - pageIndex) <= RENDER_RADIUS;

          return (
            <View key={weekStartKey} collapsable={false} style={{ flex: 1 }}>
              {shouldRender ? (
                <WeekStrip
                  weekStartKey={weekStartKey}
                  appointmentsCache={appointmentsCache}
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
  },
);
