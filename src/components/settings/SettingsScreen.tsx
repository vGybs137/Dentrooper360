import { useSegments } from "expo-router";
import { useWindowDimensions } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText, ThemedView } from "@/components/ui";
import { getWebTabBarInset } from "@/constants/navigation";
import { semantic } from "@/tokens";

import { SettingsPreferencesSection } from "./SettingsPreferencesSection";
import { SettingsProfileCard } from "./SettingsProfileCard";
import { SettingsSyncSection } from "./SettingsSyncSection";

export function SettingsScreen() {
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const scrollY = useSharedValue(0);

  const bottomInset = getWebTabBarInset(segments[0]);

  const titleTopPadding = semantic.space.section * 2;
  const titleBottomPadding = semantic.space.section;
  const displayLineHeight = semantic.type.display.lineHeight;
  const titleBlockHeight =
    titleTopPadding + displayLineHeight + titleBottomPadding;

  const listViewportHeight = windowHeight - insets.top;
  const contentBottomPadding = semantic.space.page + bottomInset;

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
    <ThemedView
      edges={["top", "left", "right"]}
      inset="none"
      padBottom={false}
      scroll={false}
      variant="screen"
    >
        <Animated.ScrollView
          contentContainerStyle={{
            paddingBottom: contentBottomPadding,
            paddingHorizontal: semantic.space.inline.compact,
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
            style={{ marginTop: semantic.space.section }}
            variant="stack"
          >
            <SettingsProfileCard />
            <SettingsPreferencesSection />
            <SettingsSyncSection />
          </ThemedView>
        </Animated.ScrollView>
    </ThemedView>
  );
}
