import { useSegments } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { ThemedText, ThemedView } from "@/components/ui";
import { getWebTabBarInset } from "@/constants/navigation";
import { semantic } from "@/tokens";

import { SettingsAboutSection } from "./SettingsAboutSection";
import { SettingsAccountSection } from "./SettingsAccountSection";
import { SettingsAppearanceSection } from "./SettingsAppearanceSection";
import { SettingsPatientsSection } from "./SettingsPatientsSection";
import { SettingsPrivacySection } from "./SettingsPrivacySection";
import { SettingsProfileCard } from "./SettingsProfileCard";
import { SettingsScheduleSection } from "./SettingsScheduleSection";
import { SettingsSecuritySection } from "./SettingsSecuritySection";
import { SettingsSyncSection } from "./SettingsSyncSection";

export function SettingsScreen() {
  const { t } = useTranslation("settings");
  const segments = useSegments();
  const scrollY = useSharedValue(0);

  const bottomInset = getWebTabBarInset(segments[0]);

  const titleTopPadding = semantic.space.section * 2;
  const titleBottomPadding = semantic.space.section;
  const displayLineHeight = semantic.type.display.lineHeight;
  const titleBlockHeight =
    titleTopPadding + displayLineHeight + titleBottomPadding;

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
            {t("title")}
          </ThemedText>
        </Animated.View>

        <ThemedView
          space="comfortable"
          style={{ marginTop: semantic.space.section }}
          variant="stack"
        >
          <SettingsProfileCard />
          <SettingsAppearanceSection />
          <SettingsScheduleSection />
          <SettingsPatientsSection />
          <SettingsSecuritySection />
          <SettingsPrivacySection />
          <SettingsSyncSection />
          <SettingsAccountSection />
          <SettingsAboutSection />
        </ThemedView>
      </Animated.ScrollView>
    </ThemedView>
  );
}
