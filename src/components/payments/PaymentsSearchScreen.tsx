import { useRouter, type Href } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { PaymentListItem } from "@/components/payments/PaymentListItem";
import { EntitySearchScreen } from "@/components/search";
import {
  filterProviderPayments,
  useProviderPayments,
  type ProviderPaymentItem,
} from "@/hooks/payments/useProviderPayments";

export function PaymentsSearchScreen() {
  const { t } = useTranslation(["payments", "a11y"]);
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

  return (
    <EntitySearchScreen
      data={visiblePayments}
      entityLabel={t("payments:search.entityLabel")}
      error={error}
      fallbackHref={"/(tabs)/payments" as Href}
      hasQuery={hasQuery}
      isLoading={isLoading}
      keyExtractor={keyExtractor}
      onChangeQuery={setQuery}
      query={query}
      renderItem={renderItem}
      searchAccessibilityLabel={t("a11y:searchPayments")}
      searchPlaceholder={t("payments:search.placeholder")}
    />
  );
}
