import { type Href, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { EntityListScreen } from "@/components/list";
import { RecallListItem } from "@/components/recalls/RecallListItem";
import { RecallsListKpis } from "@/components/recalls/RecallsListKpis";
import { clockIcon } from "@/constants";
import {
  useProviderRecalls,
  type ProviderRecallItem,
} from "@/hooks/recalls/useProviderRecalls";

export function RecallsListScreen() {
  const { t } = useTranslation(["recalls", "a11y"]);
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
      emptyIcon={clockIcon}
      emptyTitle={t("recalls:list.empty")}
      error={error}
      errorMessage={t("recalls:list.loadError")}
      isLoading={isLoading}
      keyExtractor={keyExtractor}
      listHeader={listHeader}
      openSearch={openSearch}
      renderItem={renderItem}
      searchAccessibilityLabel={t("a11y:searchRecalls")}
      title={t("recalls:list.title")}
    />
  );
}
