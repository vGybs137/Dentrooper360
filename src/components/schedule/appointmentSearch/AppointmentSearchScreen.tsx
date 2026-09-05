import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, useWindowDimensions, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { SearchBar } from "@/components/search";
import { AppointmentSearchBackButton } from "@/components/schedule/appointmentSearch/AppointmentSearchBackButton";
import { AppointmentSearchDayGroup } from "@/components/schedule/appointmentSearch/AppointmentSearchDayGroup";
import { AppointmentSearchFiltersCard } from "@/components/schedule/appointmentSearch/AppointmentSearchFiltersCard";
import { AppointmentSearchResultItem } from "@/components/schedule/appointmentSearch/AppointmentSearchResultItem";
import { ThemedText, ThemedView } from "@/components/ui";
import {
  appointmentSearchTimeWindowLabel,
  DEFAULT_APPOINTMENT_SEARCH_TIME_WINDOW,
  type AppointmentSearchTimeWindow,
} from "@/constants/appointmentSearch";
import { useAppointmentSearch } from "@/hooks/useAppointmentSearch";
import { getSearchBarReservedHeight } from "@/helpers/searchBarLayout";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";
import type { MonthDayEventPreview } from "@/types/schedule";
import {
  parseDayKey,
  toDayKey,
  toLocalDate,
  todayCalendarDate,
  type DayKey,
} from "@/utils/calendar";

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

/** Index of today, or the temporally closest day (prefer future on ties). */
function findClosestDayGroupIndex(
  groups: SearchDayGroup[],
  todayKey: DayKey,
): number {
  if (groups.length === 0) {
    return -1;
  }

  const todayIndex = groups.findIndex((group) => group.dayKey === todayKey);
  if (todayIndex >= 0) {
    return todayIndex;
  }

  const todayMs = toLocalDate(parseDayKey(todayKey)).getTime();
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < groups.length; index += 1) {
    const dayMs = toLocalDate(parseDayKey(groups[index].dayKey)).getTime();
    const distance = Math.abs(dayMs - todayMs);

    if (
      distance < bestDistance ||
      (distance === bestDistance && dayMs >= todayMs)
    ) {
      bestDistance = distance;
      bestIndex = index;
    }
  }

  return bestIndex;
}

function SearchListEmptyContent({
  error,
  hasActiveFilters,
  isLoading,
  onSelectTimeWindow,
  onToggleType,
  query,
  selectedTypeIds,
  timeWindow,
  typeOptions,
}: {
  error: unknown;
  hasActiveFilters: boolean;
  isLoading: boolean;
  onSelectTimeWindow: (window: AppointmentSearchTimeWindow) => void;
  onToggleType: (typeId: string) => void;
  query: string;
  selectedTypeIds: readonly string[];
  timeWindow: AppointmentSearchTimeWindow;
  typeOptions: ReturnType<typeof useAppointmentSearch>["typeOptions"];
}) {
  const native = useNativeColors();

  return (
    <View>
      <AppointmentSearchFiltersCard
        onSelectTimeWindow={onSelectTimeWindow}
        onToggleType={onToggleType}
        selectedTypeIds={selectedTypeIds}
        timeWindow={timeWindow}
        types={typeOptions}
      />

      {isLoading ? (
        <View className="items-center pt-stack-default">
          <ActivityIndicator color={native.brand.default} />
        </View>
      ) : null}

      {error ? (
        <View className="px-page pt-stack-default">
          <ThemedText align="center" tone="alert" variant="body">
            Unable to search appointments.
          </ThemedText>
        </View>
      ) : null}

      {!isLoading && !error && hasActiveFilters ? (
        <View className="px-page pt-stack-default">
          <ThemedText align="center" tone="muted" variant="body">
            {query.trim().length > 0
              ? `No appointments match "${query.trim()}".`
              : "No appointments match the selected filters."}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const searchListHeaderComponent = (
  titleTopPadding: number,
  titleBottomPadding: number,
  chevronRowHeight: number,
) => (
  <View>
    <View
      style={{
        paddingTop: titleTopPadding,
        paddingBottom: titleBottomPadding,
      }}
    >
      <ThemedText align="center" variant="display">
        Search
      </ThemedText>
    </View>
    <View style={{ height: chevronRowHeight }} />
  </View>
);

export function AppointmentSearchScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [timeWindow, setTimeWindow] = useState<AppointmentSearchTimeWindow>(
    DEFAULT_APPOINTMENT_SEARCH_TIME_WINDOW,
  );
  const { results, typeOptions, isLoading, error } = useAppointmentSearch(
    query,
    selectedTypeIds,
    timeWindow,
  );
  const hasQuery = query.trim().length > 0;
  const hasActiveFilters = hasQuery || selectedTypeIds.length > 0;
  const searchKey = `${query.trim()}\0${selectedTypeIds.slice().sort().join(",")}\0${timeWindow}`;
  const scrollY = useSharedValue(0);
  const savedScrollOffset = useRef(0);
  const previousSearchKeyRef = useRef(searchKey);
  const flatListRef = useRef<Animated.FlatList<SearchDayGroup>>(null);

  const dayGroups = useMemo(() => groupResultsByDay(results), [results]);
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

  const clearTimeWindow = useCallback(() => {
    setTimeWindow(DEFAULT_APPOINTMENT_SEARCH_TIME_WINDOW);
  }, []);

  const selectedTypes = useMemo(
    () => typeOptions.filter((type) => selectedTypeIds.includes(type.id)),
    [selectedTypeIds, typeOptions],
  );

  const timeWindowChipLabel =
    timeWindow === DEFAULT_APPOINTMENT_SEARCH_TIME_WINDOW
      ? null
      : appointmentSearchTimeWindowLabel(timeWindow);

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
    if (index < 0) {
      return;
    }

    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToIndex({
          index,
          animated: true,
          viewOffset: chevronRowHeight,
          viewPosition: 0,
        });
      });
    }, 120);

    return () => clearTimeout(timer);
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
      flatListRef.current?.scrollToOffset({
        offset: Math.max(0, info.averageItemLength * info.index),
        animated: false,
      });
      requestAnimationFrame(() => {
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
    () =>
      searchListHeaderComponent(
        titleTopPadding,
        titleBottomPadding,
        chevronRowHeight,
      ),
    [chevronRowHeight, titleBottomPadding, titleTopPadding],
  );

  const listEmptyComponent = useMemo(
    () => (
      <SearchListEmptyContent
        error={error}
        hasActiveFilters={hasActiveFilters}
        isLoading={isLoading}
        onSelectTimeWindow={setTimeWindow}
        onToggleType={toggleTypeFilter}
        query={query}
        selectedTypeIds={selectedTypeIds}
        timeWindow={timeWindow}
        typeOptions={typeOptions}
      />
    ),
    [
      error,
      hasActiveFilters,
      isLoading,
      query,
      selectedTypeIds,
      timeWindow,
      toggleTypeFilter,
      typeOptions,
    ],
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
