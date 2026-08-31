import { memo } from "react";

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
  accessibilityLabel = "Search",
}: SearchToggleProps) {
  return (
    <Button
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={openSearch}
      size="none"
      style={{
        width: semantic.size.touch,
        height: semantic.size.touch,
        alignItems: "flex-end",
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
