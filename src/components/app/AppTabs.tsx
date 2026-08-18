import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform } from "react-native";

import { APP_TABS } from "@/constants/navigation";
import { useThemeTokens } from "@/theme";

export default function AppTabs() {
  const theme = useThemeTokens();

  return (
    <NativeTabs
      backgroundColor={theme.palette.surface.sunken}
      blurEffect={Platform.OS === "ios" ? "systemMaterial" : undefined}
      iconColor={{
        default: theme.palette.foreground.muted,
        selected: theme.palette.brand.default,
      }}
      indicatorColor={theme.palette.surface.default}
      labelStyle={{
        default: { color: theme.palette.foreground.muted },
        selected: { color: theme.palette.foreground.default },
      }}
      rippleColor={theme.palette.brand.subtle}
      shadowColor={theme.palette.border.default}
      tintColor={theme.palette.brand.default}
    >
      {APP_TABS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon md={tab.md} sf={tab.sf} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
