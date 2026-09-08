import { type Href, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";

import { EntityListScreen } from "@/components/list";
import { RecallListItem } from "@/components/recalls/RecallListItem";
import { RecallsListKpis } from "@/components/recalls/RecallsListKpis";
import {
  useProviderRecalls,
  type ProviderRecallItem,
} from "@/hooks/recalls/useProviderRecalls";

export function RecallsListScreen() {
  const router = useRouter();
  const { recalls, kpis, isLoading, error } = useProviderRecalls();

  const openSearch = useCallback(() => {
    router.push("/recalls/search" as Href);
  }, [router]);

  const handleRecallPress = useCallback(
    (recall: ProviderRecallItem) => {
      router.push(`/recalls/${recall.id}` as Href);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: ProviderRecallItem }) => (
      <RecallListItem item={item} onPress={() => handleRecallPress(item)} />
    ),
    [handleRecallPress],
  );

  const keyExtractor = useCallback((item: ProviderRecallItem) => item.id, []);

  const listHeader = useMemo(
    () => <RecallsListKpis kpis={kpis} />,
    [kpis],
  );

  return (
    <EntityListScreen
      data={recalls}
      emptyMessage="No active recalls yet."
      error={error}
      errorMessage="Unable to load recalls."
      isLoading={isLoading}
      keyExtractor={keyExtractor}
      listHeader={listHeader}
      openSearch={openSearch}
      renderItem={renderItem}
      searchAccessibilityLabel="Search recalls"
      title="Recalls"
    />
  );
}
