import { useCallback, useState } from "react";
import type { NativeSyntheticEvent } from "react-native";
import type {
  PageScrollStateChangedNativeEventData,
  PagerViewOnPageSelectedEventData,
} from "react-native-pager-view";

export type UsePagerPageStateResult = {
  pageIndex: number;
  isDragging: boolean;
  onPageSelected: (
    event: NativeSyntheticEvent<PagerViewOnPageSelectedEventData>,
  ) => void;
  onPageScrollStateChanged: (
    event: NativeSyntheticEvent<PageScrollStateChangedNativeEventData>,
  ) => void;
  setPageIndex: (index: number) => void;
};

/** Shared pager index + drag state for day/week (and similar) PagerViews. */
export function usePagerPageState(
  initialIndex: number,
): UsePagerPageStateResult {
  const [pageIndex, setPageIndex] = useState(initialIndex);
  const [isDragging, setIsDragging] = useState(false);

  const onPageSelected = useCallback(
    (event: NativeSyntheticEvent<PagerViewOnPageSelectedEventData>) => {
      setPageIndex(event.nativeEvent.position);
    },
    [],
  );

  const onPageScrollStateChanged = useCallback(
    (event: NativeSyntheticEvent<PageScrollStateChangedNativeEventData>) => {
      setIsDragging(event.nativeEvent.pageScrollState !== "idle");
    },
    [],
  );

  return {
    pageIndex,
    isDragging,
    onPageSelected,
    onPageScrollStateChanged,
    setPageIndex,
  };
}
