import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, useWindowDimensions, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RecallListItem } from "@/components/recalls/RecallListItem";
import { SearchBar } from "@/components/search";
import { AppointmentSearchBackButton } from "@/components/schedule/appointmentSearch/AppointmentSearchBackButton";
import { ThemedText, ThemedView } from "@/components/ui";
import { getSearchBarReservedHeight } from "@/helpers/searchBarLayout";
import {
  filterProviderRecalls,
  useProviderRecalls,
  type ProviderRecallItem,
} from "@/hooks/useProviderRecalls";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

function SearchListEmptyContent({
  error,
  hasQuery,
  isLoading,
  query,
}: {
  error: Error | null;
  hasQuery: boolean;
  isLoading: boolean;
  query: string;
}) {
  const native = useNativeColors();

  return (
    <View>
      {isLoading ? (
        <View className="items-center pt-stack-default">
          <ActivityIndicator color={native.brand.default} />
        </View>
      ) : null}

      {error ? (
        <View className="px-page pt-stack-default">
          <ThemedText align="center" tone="alert" variant="body">
            Unable to search recalls.
          </ThemedText>
        </View>
      ) : null}

      {!isLoading && !error && hasQuery ? (
        <View className="px-page pt-stack-default">
          <ThemedText align="center" tone="muted" variant="body">
            {query.trim().length > 0
              ? `No recalls match "${query.trim()}".`
              : "No recalls match your search."}
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

export function RecallsSearchScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const hasQuery = query.trim().length > 0;
  const { recalls, isLoading, error } = useProviderRecalls({
    enabled: hasQuery,
  });
  const visibleRecalls = useMemo(
    () => (hasQuery ? filterProviderRecalls(recalls, query) : []),
    [hasQuery, recalls, query],
  );
  const searchKey = query.trim();
  const scrollY = useSharedValue(0);
  const savedScrollOffset = useRef(0);
  const previousSearchKeyRef = useRef(searchKey);
  const flatListRef = useRef<Animated.FlatList<ProviderRecallItem>>(null);

  const persistScrollOffset = useCallback((offset: number) => {
    savedScrollOffset.current = offset;
  }, []);

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

    router.replace("/(tabs)/recalls" as Href);
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
      if (!hasQuery) {
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
  }, [visibleRecalls, isLoading, error, searchKey, hasQuery, scrollY]);

  const handleRecallPress = useCallback(
    (recall: ProviderRecallItem) => {
      router.push(`/recalls/${recall.id}` as Href);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: ProviderRecallItem }) => (
      <View className="px-page pb-stack-compact">
        <RecallListItem
          item={item}
          onPress={() => handleRecallPress(item)}
          searchQuery={query}
        />
      </View>
    ),
    [handleRecallPress, query],
  );

  const keyExtractor = useCallback((item: ProviderRecallItem) => item.id, []);

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
        hasQuery={hasQuery}
        isLoading={isLoading}
        query={query}
      />
    ),
    [error, hasQuery, isLoading, query],
  );

  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: semantic.space.page,
      minHeight: listViewportHeight + collapseScrollDistance,
    }),
    [collapseScrollDistance, listViewportHeight],
  );

  return (
    <ThemedView
      edges={["top", "left", "right"]}
      inset="none"
      overlay={
        <AppointmentSearchBackButton
          collapseScrollDistance={collapseScrollDistance}
          initialTop={initialChevronTop}
          onClearTimeWindow={() => undefined}
          onClearType={() => undefined}
          onPress={goBack}
          pinnedTop={pinnedChevronTop}
          safeAreaLeft={insets.left}
          safeAreaRight={insets.right}
          safeAreaTop={insets.top}
          scrollY={scrollY}
          selectedTypes={[]}
          timeWindowLabel={null}
        />
      }
      padBottom={false}
      scroll={false}
      variant="screen"
    >
      <Animated.FlatList
        ref={flatListRef}
        contentContainerStyle={contentContainerStyle}
        data={visibleRecalls}
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

      <SearchBar
        accessibilityLabel="Search recalls"
        autoFocus
        onChangeText={setQuery}
        placeholder="Search recalls..."
        value={query}
      />
    </ThemedView>
  );
}
