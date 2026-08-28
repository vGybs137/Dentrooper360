import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform } from "react-native";

import { APP_TABS } from "@/constants/navigation";
import { useNativeColors } from "@/theme";

export default function AppTabs() {
  const native = useNativeColors();

  return (
    <NativeTabs
      backgroundColor={native.surface.sunken}
      blurEffect={Platform.OS === "ios" ? "systemMaterial" : undefined}
      iconColor={{
        default: native.foreground.muted,
        selected: native.brand.default,
      }}
      indicatorColor={native.surface.default}
      labelStyle={{
        default: { color: native.foreground.muted },
        selected: { color: native.foreground.default },
      }}
      rippleColor={native.brand.subtle}
      shadowColor={native.border.default}
      tintColor={native.brand.default}
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
