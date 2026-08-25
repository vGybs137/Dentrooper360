import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, useWindowDimensions, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AppointmentSearchBackButton } from "@/components/schedule/appointmentSearch/AppointmentSearchBackButton";
import {
  AppointmentSearchBar,
  getAppointmentSearchBarReservedHeight,
} from "@/components/schedule/appointmentSearch/AppointmentSearchBar";
import { AppointmentSearchDayGroup } from "@/components/schedule/appointmentSearch/AppointmentSearchDayGroup";
import { AppointmentSearchFiltersCard } from "@/components/schedule/appointmentSearch/AppointmentSearchFiltersCard";
import { ThemedText } from "@/components/ui";
import { useAppointmentSearch } from "@/hooks/useAppointmentSearch";
import { useThemeTokens } from "@/theme";
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
  onToggleType,
  query,
  selectedTypeIds,
  typeOptions,
}: {
  error: unknown;
  hasActiveFilters: boolean;
  isLoading: boolean;
  onToggleType: (typeId: string) => void;
  query: string;
  selectedTypeIds: readonly string[];
  typeOptions: ReturnType<typeof useAppointmentSearch>["typeOptions"];
}) {
  const theme = useThemeTokens();

  return (
    <View>
      <AppointmentSearchFiltersCard
        onToggleType={onToggleType}
        selectedTypeIds={selectedTypeIds}
        types={typeOptions}
      />

      {isLoading ? (
        <View className="items-center pt-stack-default">
          <ActivityIndicator color={theme.palette.brand.default} />
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
              : "No appointments match the selected types."}
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
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const { results, typeOptions, isLoading, error } = useAppointmentSearch(
    query,
    selectedTypeIds,
  );
  const hasQuery = query.trim().length > 0;
  const hasActiveFilters = hasQuery || selectedTypeIds.length > 0;
  const searchKey = `${query.trim()}\0${selectedTypeIds.slice().sort().join(",")}`;
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

  const selectedTypes = useMemo(
    () => typeOptions.filter((type) => selectedTypeIds.includes(type.id)),
    [selectedTypeIds, typeOptions],
  );

  const searchBarReservedHeight = useMemo(
    () => getAppointmentSearchBarReservedHeight(insets.bottom, theme),
    [insets.bottom, theme],
  );

  const titleTopPadding = theme.semantic.space.section * 2;
  const titleBottomPadding = theme.semantic.space.section;
  const displayLineHeight = theme.semantic.type.display.lineHeight;
  const chevronRowHeight = theme.semantic.size.touch;
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
      <AppointmentSearchDayGroup dayKey={item.dayKey} events={item.events} query={query} />
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
        onToggleType={toggleTypeFilter}
        query={query}
        selectedTypeIds={selectedTypeIds}
        typeOptions={typeOptions}
      />
    ),
    [
      error,
      hasActiveFilters,
      isLoading,
      query,
      selectedTypeIds,
      toggleTypeFilter,
      typeOptions,
    ],
  );

  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: theme.semantic.space.page,
      minHeight: listViewportHeight + collapseScrollDistance,
    }),
    [collapseScrollDistance, listViewportHeight, theme.semantic.space.page],
  );

  return (
    <View className="flex-1 bg-surface-default">
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
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

        <AppointmentSearchBar autoFocus onChangeText={setQuery} value={query} />
      </SafeAreaView>

      <AppointmentSearchBackButton
        collapseScrollDistance={collapseScrollDistance}
        initialTop={initialChevronTop}
        onClearType={clearTypeFilter}
        onPress={goBack}
        pinnedTop={pinnedChevronTop}
        safeAreaLeft={insets.left}
        safeAreaRight={insets.right}
        safeAreaTop={insets.top}
        scrollY={scrollY}
        selectedTypes={selectedTypes}
      />
    </View>
  );
}
