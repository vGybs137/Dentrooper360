import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  EntitySearchEmptyContent,
  EntitySearchTitleHeader,
  SearchBar,
} from "@/components/search";
import { AppointmentSearchBackButton } from "@/components/schedule/appointmentSearch/AppointmentSearchBackButton";
import { AppointmentSearchDayGroup } from "@/components/schedule/appointmentSearch/AppointmentSearchDayGroup";
import { AppointmentSearchFiltersCard } from "@/components/schedule/appointmentSearch/AppointmentSearchFiltersCard";
import { AppointmentSearchResultItem } from "@/components/schedule/appointmentSearch/AppointmentSearchResultItem";
import { ThemedView } from "@/components/ui";
import {
  appointmentSearchTimeWindowLabel,
  DEFAULT_APPOINTMENT_SEARCH_TIME_WINDOW,
  type AppointmentSearchCustomRange,
  type AppointmentSearchTimeWindow,
} from "@/constants/appointmentSearch";
import { findClosestDayGroupIndex } from "@/helpers/ui/dayGroups";
import { useAppointmentSearch } from "@/hooks/schedule/useAppointmentSearch";
import { getSearchBarReservedHeight } from "@/helpers/ui/searchBarLayout";
import { semantic } from "@/tokens";
import type { MonthDayEventPreview } from "@/types/schedule";
import {
  toDayKey,
  todayCalendarDate,
  type DayKey,
} from "@/helpers/schedule/calendar";

type SearchDayGroup = {
  dayKey: DayKey;
  events: MonthDayEventPreview[];
};

function groupResultsByDay(results: MonthDayEventPreview[]): SearchDayGroup[] {
  const groups: SearchDayGroup[] = [];
  const indexByDayKey = new Map<DayKey, number>();

  for (const event of results) {
    const dayKey = toDayKey(new Date(event.startTime));
    const existingIndex = indexByDayKey.get(dayKey);

    if (existingIndex === undefined) {
      indexByDayKey.set(dayKey, groups.length);
      groups.push({ dayKey, events: [event] });
      continue;
    }

    groups[existingIndex].events.push(event);
  }

  return groups;
}

const APPOINTMENT_SEARCH_EMPTY_COPY = {
  error: "Unable to search appointments.",
  noMatch: (trimmedQuery: string) =>
    `No appointments match "${trimmedQuery}".`,
  noMatchFallback: "No appointments match the selected filters.",
} as const;

export function AppointmentSearchScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [timeWindow, setTimeWindow] = useState<AppointmentSearchTimeWindow>(
    DEFAULT_APPOINTMENT_SEARCH_TIME_WINDOW,
  );
  const [customRange, setCustomRange] =
    useState<AppointmentSearchCustomRange | null>(null);
  const [customPendingStartDayKey, setCustomPendingStartDayKey] =
    useState<DayKey | null>(null);
  const [customCalendarOpen, setCustomCalendarOpen] = useState(false);
  const { results, typeOptions, isLoading, error } = useAppointmentSearch(
    query,
    selectedTypeIds,
    timeWindow,
    customRange,
  );
  const hasQuery = query.trim().length > 0;
  const hasActiveFilters = hasQuery || selectedTypeIds.length > 0;

  useEffect(() => {
    if (!hasQuery) {
      return;
    }

    setCustomCalendarOpen(false);
    setCustomPendingStartDayKey(null);
  }, [hasQuery]);

  const searchKey = `${query.trim()}\0${selectedTypeIds.slice().sort().join(",")}\0${timeWindow}\0${customRange?.startDayKey ?? ""}\0${customRange?.endDayKey ?? ""}`;
  const scrollY = useSharedValue(0);
  const savedScrollOffset = useRef(0);
  const previousSearchKeyRef = useRef(searchKey);
  const flatListRef = useRef<Animated.FlatList<SearchDayGroup>>(null);

  const dayGroups = useMemo(() => groupResultsByDay(results), [results]);
  const dayGroupsRef = useRef(dayGroups);
  dayGroupsRef.current = dayGroups;
  const dayGroupKeys = useMemo(
    () => dayGroups.map((group) => group.dayKey).join("|"),
    [dayGroups],
  );

  const persistScrollOffset = useCallback((offset: number) => {
    savedScrollOffset.current = offset;
  }, []);

  const toggleTypeFilter = useCallback((typeId: string) => {
    setSelectedTypeIds((current) =>
      current.includes(typeId)
        ? current.filter((id) => id !== typeId)
        : [...current, typeId],
    );
  }, []);

  const clearTypeFilter = useCallback((typeId: string) => {
    setSelectedTypeIds((current) => current.filter((id) => id !== typeId));
  }, []);

  const handleSelectTimeWindow = useCallback(
    (window: AppointmentSearchTimeWindow) => {
      setTimeWindow(window);
      if (window === "custom") {
        setCustomCalendarOpen(true);
        setCustomPendingStartDayKey(null);
        return;
      }

      setCustomCalendarOpen(false);
      setCustomPendingStartDayKey(null);
      setCustomRange(null);
    },
    [],
  );

  const handleCustomDayPressResult = useCallback(
    (result: {
      pendingStartDayKey: DayKey | null;
      range: AppointmentSearchCustomRange | null;
      completed: boolean;
    }) => {
      setCustomPendingStartDayKey(result.pendingStartDayKey);
      if (result.completed && result.range) {
        setCustomRange(result.range);
        setCustomCalendarOpen(false);
      }
    },
    [],
  );

  const clearTimeWindow = useCallback(() => {
    setTimeWindow(DEFAULT_APPOINTMENT_SEARCH_TIME_WINDOW);
    setCustomRange(null);
    setCustomPendingStartDayKey(null);
    setCustomCalendarOpen(false);
  }, []);

  const selectedTypes = useMemo(
    () => typeOptions.filter((type) => selectedTypeIds.includes(type.id)),
    [selectedTypeIds, typeOptions],
  );

  const timeWindowChipLabel =
    timeWindow === DEFAULT_APPOINTMENT_SEARCH_TIME_WINDOW ||
    (timeWindow === "custom" && customRange == null)
      ? null
      : appointmentSearchTimeWindowLabel(timeWindow, customRange);

  const searchBarReservedHeight = useMemo(
    () => getSearchBarReservedHeight(insets.bottom),
    [insets.bottom],
  );

  const titleTopPadding = semantic.space.section * 2;
  const titleBottomPadding = semantic.space.section;
  const displayLineHeight = semantic.type.display.lineHeight;
  const chevronRowHeight = semantic.size.touch;
  const pinnedChevronTop = 0;
  const initialChevronTop =
    pinnedChevronTop + titleTopPadding + displayLineHeight + titleBottomPadding;
  const collapseScrollDistance = initialChevronTop - pinnedChevronTop;

  const listViewportHeight =
    windowHeight - insets.top - searchBarReservedHeight;

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/schedule" as Href);
  }, [router]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      runOnJS(persistScrollOffset)(event.contentOffset.y);
    },
  });

  useEffect(() => {
    const searchChanged = previousSearchKeyRef.current !== searchKey;
    previousSearchKeyRef.current = searchKey;

    if (searchChanged) {
      if (!hasActiveFilters) {
        savedScrollOffset.current = 0;
        scrollY.value = 0;
        requestAnimationFrame(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
        });
      }
      return;
    }

    const offset = savedScrollOffset.current;
    if (offset <= 0) {
      return;
    }

    scrollY.value = offset;
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToOffset({ offset, animated: false });
    });
  }, [results, isLoading, error, searchKey, hasActiveFilters, scrollY]);

  useEffect(() => {
    if (!hasActiveFilters || isLoading || dayGroups.length === 0) {
      return;
    }

    const todayKey = toDayKey(todayCalendarDate());
    const index = findClosestDayGroupIndex(dayGroups, todayKey);
    if (index < 0 || index >= dayGroups.length) {
      return;
    }

    let frame: number | null = null;
    const timer = setTimeout(() => {
      frame = requestAnimationFrame(() => {
        frame = null;
        // Results may have cleared between schedule and fire.
        if (index >= dayGroupsRef.current.length) {
          return;
        }

        flatListRef.current?.scrollToIndex({
          index,
          animated: true,
          viewOffset: chevronRowHeight,
          viewPosition: 0,
        });
      });
    }, 120);

    return () => {
      clearTimeout(timer);
      if (frame != null) {
        cancelAnimationFrame(frame);
      }
    };
    // dayGroups is read when dayGroupKeys / searchKey change (same render).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid re-anchoring on live result refreshes
  }, [
    chevronRowHeight,
    dayGroupKeys,
    hasActiveFilters,
    isLoading,
    searchKey,
  ]);

  const handleScrollToIndexFailed = useCallback(
    (info: {
      index: number;
      highestMeasuredFrameIndex: number;
      averageItemLength: number;
    }) => {
      if (
        info.index < 0 ||
        dayGroupsRef.current.length === 0 ||
        info.index >= dayGroupsRef.current.length
      ) {
        return;
      }

      flatListRef.current?.scrollToOffset({
        offset: Math.max(0, info.averageItemLength * info.index),
        animated: false,
      });
      requestAnimationFrame(() => {
        if (info.index < 0 || info.index >= dayGroupsRef.current.length) {
          return;
        }

        flatListRef.current?.scrollToIndex({
          index: info.index,
          animated: true,
          viewOffset: chevronRowHeight,
          viewPosition: 0,
        });
      });
    },
    [chevronRowHeight],
  );

  const renderItem = useCallback(
    ({ item }: { item: SearchDayGroup }) => (
      <AppointmentSearchDayGroup
        dayKey={item.dayKey}
        items={item.events}
        renderItem={(event) => (
          <AppointmentSearchResultItem event={event} query={query} />
        )}
      />
    ),
    [query],
  );

  const keyExtractor = useCallback((item: SearchDayGroup) => item.dayKey, []);

  const listHeaderComponent = useMemo(
    () => (
      <View>
        <EntitySearchTitleHeader
          chevronRowHeight={chevronRowHeight}
          titleBottomPadding={titleBottomPadding}
          titleTopPadding={titleTopPadding}
        />
        {!hasQuery ? (
          <AppointmentSearchFiltersCard
            customCalendarOpen={customCalendarOpen}
            customPendingStartDayKey={customPendingStartDayKey}
            customRange={customRange}
            onCustomDayPressResult={handleCustomDayPressResult}
            onSelectTimeWindow={handleSelectTimeWindow}
            onToggleType={toggleTypeFilter}
            selectedTypeIds={selectedTypeIds}
            timeWindow={timeWindow}
            types={typeOptions}
          />
        ) : null}
      </View>
    ),
    [
      chevronRowHeight,
      customCalendarOpen,
      customPendingStartDayKey,
      customRange,
      handleCustomDayPressResult,
      handleSelectTimeWindow,
      hasQuery,
      selectedTypeIds,
      timeWindow,
      titleBottomPadding,
      titleTopPadding,
      toggleTypeFilter,
      typeOptions,
    ],
  );

  const listEmptyComponent = useMemo(
    () => (
      <EntitySearchEmptyContent
        copy={APPOINTMENT_SEARCH_EMPTY_COPY}
        error={error}
        hasQuery={hasActiveFilters}
        isLoading={isLoading}
        query={query}
      />
    ),
    [error, hasActiveFilters, isLoading, query],
  );

  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: semantic.space.page,
      minHeight: listViewportHeight + collapseScrollDistance,
    }),
    [collapseScrollDistance, listViewportHeight, semantic.space.page],
  );

  return (
    <ThemedView
      edges={["top", "left", "right"]}
      inset="none"
      overlay={
        <AppointmentSearchBackButton
          collapseScrollDistance={collapseScrollDistance}
          initialTop={initialChevronTop}
          onClearTimeWindow={clearTimeWindow}
          onClearType={clearTypeFilter}
          onPress={goBack}
          pinnedTop={pinnedChevronTop}
          safeAreaLeft={insets.left}
          safeAreaRight={insets.right}
          safeAreaTop={insets.top}
          scrollY={scrollY}
          selectedTypes={selectedTypes}
          timeWindowLabel={timeWindowChipLabel}
        />
      }
      padBottom={false}
      scroll={false}
      variant="screen"
    >
      <Animated.FlatList
        ref={flatListRef}
        contentContainerStyle={contentContainerStyle}
        data={dayGroups}
        keyboardShouldPersistTaps="handled"
        keyExtractor={keyExtractor}
        ListEmptyComponent={listEmptyComponent}
        ListHeaderComponent={listHeaderComponent}
        onScroll={scrollHandler}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        renderItem={renderItem}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      />

      <SearchBar
        accessibilityLabel="Search appointments"
        autoFocus
        onChangeText={setQuery}
        placeholder="Search by subject..."
        value={query}
      />
    </ThemedView>
  );
}
