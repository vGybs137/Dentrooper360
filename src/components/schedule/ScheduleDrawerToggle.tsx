import { memo, useCallback } from "react";
import { Pressable } from "react-native";
import { SymbolView } from "expo-symbols";
import { useNavigation } from "expo-router";

import { useThemeTokens } from "@/theme";

const menuIcon = {
  ios: "line.3.horizontal",
  android: "menu",
  web: "menu",
} as const;

function ScheduleDrawerToggleComponent() {
  const theme = useThemeTokens();
  const navigation = useNavigation();

  const openDrawer = useCallback(() => {
    navigation.dispatch({ type: "OPEN_DRAWER" });
  }, [navigation]);

  return (
    <Pressable
      accessibilityLabel="Open calendar views"
      accessibilityRole="button"
      hitSlop={8}
      onPress={openDrawer}
      style={{
        alignItems: "flex-start",
        justifyContent: "center",
        width: theme.semantic.size.touch,
        minHeight: theme.semantic.size.touch,
      }}
    >
      <SymbolView
        name={menuIcon}
        size={theme.semantic.size.icon}
        tintColor={theme.palette.foreground.default}
      />
    </Pressable>
  );
}

export const ScheduleDrawerToggle = memo(ScheduleDrawerToggleComponent);
