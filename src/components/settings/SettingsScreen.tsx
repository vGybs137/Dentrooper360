import { useSegments } from "expo-router";
import { Platform, useWindowDimensions, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { ThemedText, ThemedView } from "@/components/ui";
import { BOTTOM_TAB_INSET } from "@/constants/navigation";
import { useThemeTokens } from "@/theme";

import { SettingsPreferencesSection } from "./SettingsPreferencesSection";
import { SettingsProfileCard } from "./SettingsProfileCard";
import { SettingsSyncSection } from "./SettingsSyncSection";

export function SettingsScreen() {
  const segments = useSegments();
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const scrollY = useSharedValue(0);

  const bottomInset =
    Platform.OS === "web" && segments[0] === "(tabs)" ? BOTTOM_TAB_INSET : 0;

  const titleTopPadding = theme.semantic.space.section * 2;
  const titleBottomPadding = theme.semantic.space.section;
  const displayLineHeight = theme.semantic.type.display.lineHeight;
  const titleBlockHeight =
    titleTopPadding + displayLineHeight + titleBottomPadding;

  const listViewportHeight = windowHeight - insets.top;
  const contentBottomPadding = theme.semantic.space.page + bottomInset;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Fade as the large title collapses — same scroll distance Search uses
  // to pin the back chevron (title block height).
  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, titleBlockHeight],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.palette.surface.default,
      }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <Animated.ScrollView
          contentContainerStyle={{
            paddingBottom: contentBottomPadding,
            paddingHorizontal: theme.semantic.space.inline.compact,
            // Same as Search: enough room to scroll the large title fully away.
            minHeight: listViewportHeight + titleBlockHeight,
          }}
          keyboardShouldPersistTaps="handled"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          <Animated.View
            style={[
              {
                paddingTop: titleTopPadding,
                paddingBottom: titleBottomPadding,
              },
              titleAnimatedStyle,
            ]}
          >
            <ThemedText align="center" variant="display">
              Settings
            </ThemedText>
          </Animated.View>

          <ThemedView
            space="comfortable"
            style={{ marginTop: theme.semantic.space.section }}
            variant="stack"
          >
            <SettingsProfileCard />
            <SettingsPreferencesSection />
            <SettingsSyncSection />
          </ThemedView>
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}
