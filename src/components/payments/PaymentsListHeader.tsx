import { memo } from "react";

import { EntityListHeader } from "@/components/list";

export type PaymentsListHeaderProps = {
  openSearch: () => void;
  searchAccessibilityLabel?: string;
  title?: string;
};

function PaymentsListHeaderComponent({
  openSearch,
  searchAccessibilityLabel = "Search payments",
  title = "Payments",
}: PaymentsListHeaderProps) {
  return (
    <EntityListHeader
      openSearch={openSearch}
      searchAccessibilityLabel={searchAccessibilityLabel}
      title={title}
    />
  );
}

export const PaymentsListHeader = memo(PaymentsListHeaderComponent);
