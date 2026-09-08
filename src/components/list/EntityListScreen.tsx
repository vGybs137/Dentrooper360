import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { EntityListHeader } from "@/components/list/EntityListHeader";
import {
  ScrollToTopButton,
  ThemedText,
  ThemedView,
  type ThemedIconProps,
} from "@/components/ui";
import { SCROLL_TO_TOP_THRESHOLD } from "@/constants";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

function EntityListEmpty({
  emptyMessage,
  error,
  errorMessage,
  isLoading,
}: {
  emptyMessage: string;
  error: Error | null;
  errorMessage: string;
  isLoading: boolean;
}) {
  const native = useNativeColors();

  if (isLoading) {
    return (
      <View className="items-center py-section">
        <ActivityIndicator color={native.brand.default} />
      </View>
    );
  }

  if (error) {
    return (
      <ThemedText
        align="center"
        className="px-page py-stack"
        tone="alert"
        variant="body"
      >
        {errorMessage}
      </ThemedText>
    );
  }

  return (
    <ThemedText
      align="center"
      className="px-page py-stack"
      tone="muted"
      variant="body"
    >
      {emptyMessage}
    </ThemedText>
  );
}

export type EntityListScreenProps<T> = {
  title: string;
  openSearch: () => void;
  searchAccessibilityLabel?: string;
  onAdd?: () => void;
  addAccessibilityLabel?: string;
  addIcon?: NonNullable<ThemedIconProps["name"]>;
  data: readonly T[];
  isLoading: boolean;
  error: Error | null;
  errorMessage: string;
  emptyMessage: string;
  keyExtractor: (item: T, index: number) => string;
  renderItem: ListRenderItem<T>;
  listHeader?: ReactNode;
};

/** Tab list chrome: header, optional KPI/chart slot, FlatList, scroll-to-top. */
export function EntityListScreen<T>({
  addAccessibilityLabel,
  addIcon,
  data,
  emptyMessage,
  error,
  errorMessage,
  isLoading,
  keyExtractor,
  listHeader,
  onAdd,
  openSearch,
  renderItem,
  searchAccessibilityLabel,
  title,
}: EntityListScreenProps<T>): ReactElement {
  const flatListRef = useRef<FlatList<T>>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      setShowScrollToTop(offsetY > SCROLL_TO_TOP_THRESHOLD);
    },
    [],
  );

  const handleScrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const listEmptyComponent = useMemo(
    () => (
      <EntityListEmpty
        emptyMessage={emptyMessage}
        error={error}
        errorMessage={errorMessage}
        isLoading={isLoading}
      />
    ),
    [emptyMessage, error, errorMessage, isLoading],
  );

  return (
    <ThemedView className="flex-1" scroll={false} variant="stack">
      <View className="z-10 bg-surface-default">
        <EntityListHeader
          addAccessibilityLabel={addAccessibilityLabel}
          addIcon={addIcon}
          onAdd={onAdd}
          openSearch={openSearch}
          searchAccessibilityLabel={searchAccessibilityLabel}
          title={title}
        />
      </View>

      <View className="relative flex-1">
        <FlatList
          ref={flatListRef}
          contentContainerStyle={{
            gap: semantic.space.gap.default,
            flexGrow: data.length === 0 ? 1 : undefined,
            paddingBottom: semantic.space.page,
          }}
          data={data as T[]}
          keyboardShouldPersistTaps="handled"
          keyExtractor={keyExtractor}
          ListEmptyComponent={listEmptyComponent}
          ListHeaderComponent={
            listHeader ? () => <>{listHeader}</> : null
          }
          onScroll={handleScroll}
          renderItem={renderItem}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        />

        <ScrollToTopButton
          onPress={handleScrollToTop}
          visible={showScrollToTop}
        />
      </View>
    </ThemedView>
  );
}
