import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, useWindowDimensions, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PaymentListItem } from "@/components/payments/PaymentListItem";
import { SearchBar } from "@/components/search";
import { AppointmentSearchBackButton } from "@/components/schedule/appointmentSearch/AppointmentSearchBackButton";
import { ThemedText, ThemedView } from "@/components/ui";
import { getSearchBarReservedHeight } from "@/helpers/searchBarLayout";
import {
  filterProviderPayments,
  useProviderPayments,
  type ProviderPaymentItem,
} from "@/hooks/useProviderPayments";
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
            Unable to search payments.
          </ThemedText>
        </View>
      ) : null}

      {!isLoading && !error && hasQuery ? (
        <View className="px-page pt-stack-default">
          <ThemedText align="center" tone="muted" variant="body">
            {query.trim().length > 0
              ? `No payments match "${query.trim()}".`
              : "No payments match your search."}
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

export function PaymentsSearchScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const hasQuery = query.trim().length > 0;
  const { payments, isLoading, error } = useProviderPayments({
    enabled: hasQuery,
  });
  const visiblePayments = useMemo(
    () => (hasQuery ? filterProviderPayments(payments, query) : []),
    [hasQuery, payments, query],
  );
  const searchKey = query.trim();
  const scrollY = useSharedValue(0);
  const savedScrollOffset = useRef(0);
  const previousSearchKeyRef = useRef(searchKey);
  const flatListRef = useRef<Animated.FlatList<ProviderPaymentItem>>(null);

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

    router.replace("/(tabs)/payments" as Href);
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
  }, [visiblePayments, isLoading, error, searchKey, hasQuery, scrollY]);

  const handlePaymentPress = useCallback(
    (payment: ProviderPaymentItem) => {
      if (!payment.patientId) {
        return;
      }

      router.push(`/patients/${payment.patientId}` as Href);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: ProviderPaymentItem }) => (
      <View className="px-page pb-stack-compact">
        <PaymentListItem
          item={item}
          onPress={() => handlePaymentPress(item)}
          searchQuery={query}
        />
      </View>
    ),
    [handlePaymentPress, query],
  );

  const keyExtractor = useCallback((item: ProviderPaymentItem) => item.id, []);

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
        data={visiblePayments}
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
        accessibilityLabel="Search payments"
        autoFocus
        onChangeText={setQuery}
        placeholder="Search payments..."
        value={query}
      />
    </ThemedView>
  );
}
