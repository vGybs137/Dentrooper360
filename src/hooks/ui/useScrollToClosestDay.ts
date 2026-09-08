import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { FlatList as FlatListType } from "react-native";

import { findClosestDayGroupIndex } from "@/helpers/ui/dayGroups";
import {
  toDayKey,
  todayCalendarDate,
  type DayKey,
} from "@/helpers/schedule/calendar";

type DayKeyedItem = {
  dayKey: DayKey;
};

/**
 * Scroll a day-grouped FlatList to today (or the closest day) once after load.
 */
export function useScrollToClosestDay<T extends DayKeyedItem>(
  listRef: RefObject<FlatListType<T> | null>,
  dayGroups: readonly T[],
  isLoading: boolean,
): {
  onScrollToIndexFailed: (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => void;
} {
  const hasScrolledToToday = useRef(false);
  const dayGroupKeys = dayGroups.map((group) => group.dayKey).join("|");

  useEffect(() => {
    if (isLoading || dayGroups.length === 0 || hasScrolledToToday.current) {
      return;
    }

    const todayKey = toDayKey(todayCalendarDate());
    const index = findClosestDayGroupIndex(dayGroups, todayKey);
    if (index < 0) {
      return;
    }

    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
        hasScrolledToToday.current = true;
      });
    }, 120);

    return () => clearTimeout(timer);
    // dayGroups is read when dayGroupKeys change (same render).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid re-anchoring on live refreshes
  }, [dayGroupKeys, isLoading, listRef]);

  const onScrollToIndexFailed = useCallback(
    (info: {
      index: number;
      highestMeasuredFrameIndex: number;
      averageItemLength: number;
    }) => {
      listRef.current?.scrollToOffset({
        offset: Math.max(0, info.averageItemLength * info.index),
        animated: false,
      });
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({
          index: info.index,
          animated: true,
          viewPosition: 0.5,
        });
      });
    },
    [listRef],
  );

  return { onScrollToIndexFailed };
}
