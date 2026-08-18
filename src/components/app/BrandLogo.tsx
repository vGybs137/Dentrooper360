import { Image } from "expo-image";
import { type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { type AnimatedStyle } from "react-native-reanimated";

import { Stack, ThemedText, ThemedView } from "@/components/ui";
import { useThemeTokens } from "@/theme";

const markLogo = require("../../assets/no-text-logo.svg");
const wordmarkLogo = require("../../assets/text-logo.svg");

type BrandLogoProps = {
  showWordmark?: boolean;
  wordmarkStyle?: StyleProp<ViewStyle> | AnimatedStyle<ViewStyle>;
};

export function BrandLogo({
  showWordmark = true,
  wordmarkStyle,
}: BrandLogoProps) {
  return (
    <Stack space="default" align="center">
      <Image
        accessibilityLabel="Dentrooper 360 mark"
        contentFit="contain"
        source={markLogo}
        style={{ width: 160, height: 160 }}
      />
      {showWordmark ? (
        <Animated.View style={wordmarkStyle}>
          <Image
            accessibilityLabel="Dentrooper 360"
            contentFit="contain"
            source={wordmarkLogo}
            style={{ width: 280, height: 36 }}
          />
        </Animated.View>
      ) : null}
    </Stack>
  );
}

export function SplashAttribution() {
  return (
    <Stack space="compact" align="center">
      <ThemedText align="center" tone="muted" variant="label">
        From
      </ThemedText>
      <ThemedText align="center" variant="label">
        Sol-T Solutions
      </ThemedText>
    </Stack>
  );
}

export function useSplashFooterOffset() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();

  return (
    theme.semantic.type.label.lineHeight * 2 +
    theme.semantic.space.gap.compact +
    theme.semantic.space.page +
    insets.bottom
  );
}

export function SplashFooter() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        right: 0,
        bottom: 0,
        left: 0,
        alignItems: "center",
        paddingBottom: theme.semantic.space.page + insets.bottom,
      }}
    >
      <SplashAttribution />
    </View>
  );
}

export function BrandedSplash({ children }: { children?: ReactNode }) {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView surface="sunken" style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <BrandLogo />
      </View>
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          left: 0,
          alignItems: "center",
          paddingHorizontal: theme.semantic.space.inline.comfortable,
          paddingBottom: theme.semantic.space.page + insets.bottom,
          gap: theme.semantic.space.gap.default,
        }}
      >
        {children}
        <SplashAttribution />
      </View>
    </ThemedView>
  );
}
