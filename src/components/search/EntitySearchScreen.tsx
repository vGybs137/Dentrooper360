import { useRouter, type Href } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactElement,
} from "react";
import {
  ActivityIndicator,
  useWindowDimensions,
  View,
  type ListRenderItem,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SearchBar } from "@/components/search/SearchBar";
import { AppointmentSearchBackButton } from "@/components/schedule/appointmentSearch/AppointmentSearchBackButton";
import { ThemedText, ThemedView } from "@/components/ui";
import { getSearchBarReservedHeight } from "@/helpers/ui/searchBarLayout";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

export type EntitySearchEmptyCopy = {
  error: string;
  noMatch: (trimmedQuery: string) => string;
  noMatchFallback: string;
};

export function defaultEntitySearchEmptyCopy(
  entityLabel: string,
): EntitySearchEmptyCopy {
  return {
    error: `Unable to search ${entityLabel}.`,
    noMatch: (trimmedQuery) => `No ${entityLabel} match "${trimmedQuery}".`,
    noMatchFallback: `No ${entityLabel} match your search.`,
  };
}

export function EntitySearchEmptyContent({
  copy,
  error,
  hasQuery,
  isLoading,
  query,
}: {
  copy: EntitySearchEmptyCopy;
  error: Error | null;
  hasQuery: boolean;
  isLoading: boolean;
  query: string;
}) {
  const native = useNativeColors();
  const trimmed = query.trim();

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
            {copy.error}
          </ThemedText>
        </View>
      ) : null}

      {!isLoading && !error && hasQuery ? (
        <View className="px-page pt-stack-default">
          <ThemedText align="center" tone="muted" variant="body">
            {trimmed.length > 0 ? copy.noMatch(trimmed) : copy.noMatchFallback}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

export function EntitySearchTitleHeader({
  chevronRowHeight,
  titleBottomPadding,
  titleTopPadding,
}: {
  chevronRowHeight: number;
  titleBottomPadding: number;
  titleTopPadding: number;
}) {
  return (
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
}

export type EntitySearchScreenProps<T> = {
  /** Plural entity name used in default empty/error copy (e.g. "patients"). */
  entityLabel: string;
  fallbackHref: Href;
  searchPlaceholder: string;
  searchAccessibilityLabel: string;
  query: string;
  onChangeQuery: (query: string) => void;
  hasQuery: boolean;
  data: readonly T[];
  isLoading: boolean;
  error: Error | null;
  keyExtractor: (item: T, index: number) => string;
  renderItem: ListRenderItem<T>;
  /** Override default empty/error strings. */
  emptyCopy?: EntitySearchEmptyCopy;
};

/** Collapsing search chrome shared by patients / payments / recalls search. */
export function EntitySearchScreen<T>({
  data,
  emptyCopy,
  entityLabel,
  error,
  fallbackHref,
  hasQuery,
  isLoading,
  keyExtractor,
  onChangeQuery,
  query,
  renderItem,
  searchAccessibilityLabel,
  searchPlaceholder,
}: EntitySearchScreenProps<T>): ReactElement {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const router = useRouter();
  const copy = useMemo(
    () => emptyCopy ?? defaultEntitySearchEmptyCopy(entityLabel),
    [emptyCopy, entityLabel],
  );
  const searchKey = query.trim();
  const scrollY = useSharedValue(0);
  const savedScrollOffset = useRef(0);
  const previousSearchKeyRef = useRef(searchKey);
  const flatListRef = useRef<Animated.FlatList<T>>(null);

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

    router.replace(fallbackHref);
  }, [fallbackHref, router]);

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
  }, [data, isLoading, error, searchKey, hasQuery, scrollY]);

  const listHeaderComponent = useMemo(
    () => (
      <EntitySearchTitleHeader
        chevronRowHeight={chevronRowHeight}
        titleBottomPadding={titleBottomPadding}
        titleTopPadding={titleTopPadding}
      />
    ),
    [chevronRowHeight, titleBottomPadding, titleTopPadding],
  );

  const listEmptyComponent = useMemo(
    () => (
      <EntitySearchEmptyContent
        copy={copy}
        error={error}
        hasQuery={hasQuery}
        isLoading={isLoading}
        query={query}
      />
    ),
    [copy, error, hasQuery, isLoading, query],
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
        data={data as T[]}
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
        accessibilityLabel={searchAccessibilityLabel}
        autoFocus
        onChangeText={onChangeQuery}
        placeholder={searchPlaceholder}
        value={query}
      />
    </ThemedView>
  );
}
