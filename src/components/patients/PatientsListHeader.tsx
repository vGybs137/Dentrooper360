import { memo, useMemo } from "react";
import { View } from "react-native";

import { Button, SearchToggle, ThemedIcon, ThemedText } from "@/components/ui";
import { personAddIcon } from "@/constants";
import { semantic } from "@/tokens";

export type PatientsListHeaderProps = {
  openSearch: () => void;
  openAddPatient: () => void;
  title?: string;
};

function PatientsListHeaderComponent({
  openSearch,
  openAddPatient,
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
      <View className="flex-row items-center gap-1">
        <Button
          accessibilityLabel="Add patient"
          hitSlop={8}
          onPress={openAddPatient}
          style={{
            width: semantic.size.touch,
            height: semantic.size.touch,
            alignItems: "center",
            justifyContent: "center",
          }}
          size="sm"
          tone="neutral"
          variant="ghost"
        >
          <ThemedIcon dimension={22} name={personAddIcon} />
        </Button>
        <SearchToggle
          accessibilityLabel="Search patients"
          openSearch={openSearch}
        />
      </View>
    </View>
  );
}

export const PatientsListHeader = memo(PatientsListHeaderComponent);
