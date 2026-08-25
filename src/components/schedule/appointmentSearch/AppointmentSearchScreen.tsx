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
import { AppointmentSearchResultItem } from "@/components/schedule/appointmentSearch/AppointmentSearchResultItem";
import { ThemedText } from "@/components/ui";
import { useAppointmentSearch } from "@/hooks/useAppointmentSearch";
import { useThemeTokens } from "@/theme";
import type { MonthDayEventPreview } from "@/types/schedule";

function SearchStatusContent({
  error,
  hasQuery,
  isLoading,
  query,
}: {
  error: unknown;
  hasQuery: boolean;
  isLoading: boolean;
  query: string;
}) {
  const theme = useThemeTokens();

  if (!hasQuery) {
    return (
      <View className="px-page pt-stack-default">
        <ThemedText align="center" tone="muted" variant="body">
          Enter a subject to find appointments.
        </ThemedText>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="items-center pt-stack-default">
        <ActivityIndicator color={theme.palette.brand.default} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="px-page pt-stack-default">
        <ThemedText tone="alert" variant="body">
          Unable to search appointments.
        </ThemedText>
      </View>
    );
  }

  return (
    <View className="px-page pt-stack-default">
      <ThemedText align="center" tone="muted" variant="body">
        No appointments match &quot;{query.trim()}&quot;.
      </ThemedText>
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
  const { results, isLoading, error } = useAppointmentSearch(query);
  const hasQuery = query.trim().length > 0;
  const scrollY = useSharedValue(0);
  const savedScrollOffset = useRef(0);
  const flatListRef = useRef<Animated.FlatList<MonthDayEventPreview>>(null);

  const persistScrollOffset = useCallback((offset: number) => {
    savedScrollOffset.current = offset;
  }, []);

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
    const offset = savedScrollOffset.current;
    if (offset <= 0) {
      return;
    }

    scrollY.value = offset;
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToOffset({ offset, animated: false });
    });
  }, [results, isLoading, error, hasQuery, scrollY]);

  const renderItem = useCallback(
    ({ item }: { item: MonthDayEventPreview }) => (
      <AppointmentSearchResultItem event={item} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: MonthDayEventPreview) => item.id, []);

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
      <SearchStatusContent
        error={error}
        hasQuery={hasQuery}
        isLoading={isLoading}
        query={query}
      />
    ),
    [error, hasQuery, isLoading, query],
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
          data={results}
          keyboardShouldPersistTaps="handled"
          keyExtractor={keyExtractor}
          ListEmptyComponent={listEmptyComponent}
          ListHeaderComponent={listHeaderComponent}
          onScroll={scrollHandler}
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
        onPress={goBack}
        pinnedTop={pinnedChevronTop}
        safeAreaLeft={insets.left}
        safeAreaTop={insets.top}
        scrollY={scrollY}
      />
    </View>
  );
}
