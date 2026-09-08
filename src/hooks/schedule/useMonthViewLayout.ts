import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

import { BOTTOM_TAB_INSET } from "@/constants/navigation";
import {
  estimateMonthViewLayout,
  type MonthViewLayout,
} from "@/helpers/schedule/monthViewLayout";
import { useStableSafeAreaInsets } from "@/helpers/ui/safeAreaInsets";

/** Window-token geometry so month cells and chips can paint before onLayout. */
export function useMonthViewLayout(): MonthViewLayout {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useStableSafeAreaInsets();

  return useMemo(
    () =>
      estimateMonthViewLayout({
        windowHeight,
        insets,
        tabBarInset: BOTTOM_TAB_INSET,
      }),
    [insets.bottom, insets.top, windowHeight],
  );
}
