import { memo, useMemo } from "react";
import { View } from "react-native";

import { SearchToggle, ThemedText } from "@/components/ui";
import { semantic } from "@/tokens";

export type PatientsListHeaderProps = {
  openSearch: () => void;
  title?: string;
};

function PatientsListHeaderComponent({
  openSearch,
  title = "Patients",
}: PatientsListHeaderProps) {
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
        accessibilityLabel="Search patients"
        openSearch={openSearch}
      />
    </View>
  );
}

export const PatientsListHeader = memo(PatientsListHeaderComponent);
