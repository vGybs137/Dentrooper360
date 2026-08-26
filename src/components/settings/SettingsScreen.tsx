import { useSegments } from "expo-router";
import { Platform, View } from "react-native";

import { Screen, Stack, ThemedText } from "@/components/ui";
import { BOTTOM_TAB_INSET } from "@/constants/navigation";
import { useThemeTokens } from "@/theme";

import { SettingsPreferencesSection } from "./SettingsPreferencesSection";
import { SettingsProfileCard } from "./SettingsProfileCard";
import { SettingsSyncSection } from "./SettingsSyncSection";

export function SettingsScreen() {
  const segments = useSegments();
  const theme = useThemeTokens();
  const bottomInset =
    Platform.OS === "web" && segments[0] === "(tabs)" ? BOTTOM_TAB_INSET : 0;

  return (
    <Screen
      bottomInset={bottomInset}
      edges={["top", "left", "right"]}
      inset="compact"
      scroll
    >
      <View
        style={{
          paddingBottom: theme.semantic.space.stack.comfortable,
        }}
      >
        <ThemedText variant="title">Settings</ThemedText>
      </View>

      <Stack space="comfortable">
        <SettingsProfileCard />
        <SettingsPreferencesSection />
        <SettingsSyncSection />
      </Stack>
    </Screen>
  );
}
