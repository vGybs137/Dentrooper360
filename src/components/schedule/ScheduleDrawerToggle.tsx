import { memo, useCallback } from "react";
import { useNavigation } from "expo-router";

import { Button, ThemedIcon } from "@/components/ui";
import { semantic } from "@/tokens";

const menuIcon = {
  ios: "line.3.horizontal",
  android: "menu",
  web: "menu",
} as const;

function ScheduleDrawerToggleComponent() {
  const navigation = useNavigation();

  const openDrawer = useCallback(() => {
    navigation.dispatch({ type: "OPEN_DRAWER" });
  }, [navigation]);

  return (
    <Button
      accessibilityLabel="Open calendar views"
      hitSlop={8}
      onPress={openDrawer}
      size="none"
      style={{
        width: semantic.size.touch,
        height: semantic.size.touch,
        alignItems: "flex-start",
        justifyContent: "center",
      }}
      tone="neutral"
      variant="ghost"
    >
      <ThemedIcon name={menuIcon} />
    </Button>
  );
}

export const ScheduleDrawerToggle = memo(ScheduleDrawerToggleComponent);
