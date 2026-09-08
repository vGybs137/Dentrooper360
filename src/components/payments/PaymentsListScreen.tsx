import { type Href, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";

import { EntityListScreen } from "@/components/list";
import { PaymentListItem } from "@/components/payments/PaymentListItem";
import { PaymentsTrendChart } from "@/components/payments/PaymentsTrendChart";
import {
  useProviderPayments,
  type ProviderPaymentItem,
} from "@/hooks/payments/useProviderPayments";
import { useAuthUser } from "@/stores";

export function PaymentsListScreen() {
  const router = useRouter();
  const user = useAuthUser();
  const { payments, isLoading, error } = useProviderPayments();

  const currencySymbol = user?.currencySymbol ?? null;

  const openSearch = useCallback(() => {
    router.push("/payments/search" as Href);
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: ProviderPaymentItem }) => (
      <PaymentListItem item={item} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: ProviderPaymentItem) => item.id, []);

  const listHeader = useMemo(
    () => (
      <PaymentsTrendChart
        currencySymbol={currencySymbol}
        payments={payments}
      />
    ),
    [currencySymbol, payments],
  );

  return (
    <EntityListScreen
      data={payments}
      emptyMessage="No payments yet."
      error={error}
      errorMessage="Unable to load payments."
      isLoading={isLoading}
      keyExtractor={keyExtractor}
      listHeader={listHeader}
      openSearch={openSearch}
      renderItem={renderItem}
      searchAccessibilityLabel="Search payments"
      title="Payments"
    />
  );
}
