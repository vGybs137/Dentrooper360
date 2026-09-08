import { useRouter, type Href } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";

import { RecallListItem } from "@/components/recalls/RecallListItem";
import { EntitySearchScreen } from "@/components/search";
import {
  filterProviderRecalls,
  useProviderRecalls,
  type ProviderRecallItem,
} from "@/hooks/recalls/useProviderRecalls";

export function RecallsSearchScreen() {
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

  return (
    <EntitySearchScreen
      data={visibleRecalls}
      entityLabel="recalls"
      error={error}
      fallbackHref={"/(tabs)/recalls" as Href}
      hasQuery={hasQuery}
      isLoading={isLoading}
      keyExtractor={keyExtractor}
      onChangeQuery={setQuery}
      query={query}
      renderItem={renderItem}
      searchAccessibilityLabel="Search recalls"
      searchPlaceholder="Search recalls..."
    />
  );
}
