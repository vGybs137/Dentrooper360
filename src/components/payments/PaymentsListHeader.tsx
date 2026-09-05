import { memo, useMemo } from "react";
import { View } from "react-native";

import { SearchToggle, ThemedText } from "@/components/ui";
import { semantic } from "@/tokens";

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
  const rootStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      alignItems: "center" as const,
      width: "100%" as const,
      paddingBottom: semantic.space.stack.compact,
    }),
    [],
  );

  return (
    <View style={rootStyle}>
      <ThemedText numberOfLines={1} variant="title">
        {title}
      </ThemedText>
      <View style={{ flex: 1, minWidth: 0 }} />
      <SearchToggle
        accessibilityLabel={searchAccessibilityLabel}
        openSearch={openSearch}
      />
    </View>
  );
}

export const PaymentsListHeader = memo(PaymentsListHeaderComponent);
