import { memo } from "react";
import { useTranslation } from "react-i18next";

import { EntityListHeader } from "@/components/list";

export type PaymentsListHeaderProps = {
  openSearch: () => void;
  searchAccessibilityLabel?: string;
  title?: string;
};

function PaymentsListHeaderComponent({
  openSearch,
  searchAccessibilityLabel,
  title,
}: PaymentsListHeaderProps) {
  const { t } = useTranslation(["payments", "a11y"]);

  return (
    <EntityListHeader
      openSearch={openSearch}
      searchAccessibilityLabel={
        searchAccessibilityLabel ?? t("a11y:searchPayments")
      }
      title={title ?? t("payments:list.title")}
    />
  );
}

export const PaymentsListHeader = memo(PaymentsListHeaderComponent);
