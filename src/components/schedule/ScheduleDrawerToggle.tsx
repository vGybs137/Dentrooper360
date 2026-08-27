import { memo, useCallback } from "react";
import { useNavigation } from "expo-router";

import { Button, ThemedIcon } from "@/components/ui";

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
      className="min-h-touch w-touch items-start"
      hitSlop={8}
      onPress={openDrawer}
      size="none"
      tone="neutral"
      variant="ghost"
    >
      <ThemedIcon name={menuIcon} />
    </Button>
  );
}

export const ScheduleDrawerToggle = memo(ScheduleDrawerToggleComponent);
