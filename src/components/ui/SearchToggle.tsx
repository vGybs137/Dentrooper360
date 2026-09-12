import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { ThemedIcon } from "@/components/ui/ThemedIcon";
import { searchIcon } from "@/constants";
import { semantic } from "@/tokens";

export type SearchToggleProps = {
  openSearch: () => void;
  accessibilityLabel?: string;
};

function SearchToggleComponent({
  openSearch,
  accessibilityLabel,
}: SearchToggleProps) {
  const { t } = useTranslation("a11y");
  return (
    <Button
      accessibilityLabel={accessibilityLabel ?? t("search")}
      hitSlop={8}
      onPress={openSearch}
      size="none"
      style={{
        width: semantic.size.touch,
        height: semantic.size.touch,
        alignItems: "center",
        justifyContent: "center",
      }}
      tone="neutral"
      variant="ghost"
    >
      <ThemedIcon name={searchIcon} />
    </Button>
  );
}

export const SearchToggle = memo(SearchToggleComponent);
