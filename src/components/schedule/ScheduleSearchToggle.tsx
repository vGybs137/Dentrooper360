import { memo, useCallback } from "react";
import { Pressable } from "react-native";
import { SymbolView } from "expo-symbols";
import { useRouter, type Href } from "expo-router";

import { searchIcon } from "@/constants";
import { useThemeTokens } from "@/theme";

function ScheduleSearchToggleComponent() {
  const theme = useThemeTokens();
  const router = useRouter();

  const openSearch = useCallback(() => {
    router.push("/appointments/search" as Href);
  }, [router]);

  return (
    <Pressable
      accessibilityLabel="Search appointments"
      accessibilityRole="button"
      hitSlop={8}
      onPress={openSearch}
      style={{
        alignItems: "flex-end",
        justifyContent: "center",
        width: theme.semantic.size.touch,
        minHeight: theme.semantic.size.touch,
      }}
    >
      <SymbolView
        name={searchIcon}
        size={theme.semantic.size.icon}
        tintColor={theme.palette.foreground.default}
      />
    </Pressable>
  );
}

export const ScheduleSearchToggle = memo(ScheduleSearchToggleComponent);
