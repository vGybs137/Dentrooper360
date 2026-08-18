import { type Href, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandLogo, SplashAttribution } from "@/components/app/BrandLogo";
import { Button, Stack, ThemedText, ThemedView } from "@/components/ui";
import { hideNativeSplash } from "@/helpers/nativeSplash";
import { useThemeTokens } from "@/theme";

export default function OnboardingScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  const cardHeight = useSharedValue(0);
  const holdMs = theme.semantic.motion.overlay.duration * 2;
  const moveMs =
    theme.semantic.motion.overlay.duration +
    theme.semantic.motion.enter.duration;
  const moveEasing = Easing.bezier(0.05, 0.7, 0.1, 1);

  useEffect(() => {
    void hideNativeSplash();
  }, []);

  const logoStyle = useAnimatedStyle(() => {
    const offset = Math.max((cardHeight.value - insets.top) / 2, 0);

    return {
      transform: [{ translateY: -progress.value * offset }],
    };
  });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          cardHeight.value === 0
            ? 400
            : (1 - progress.value) * cardHeight.value,
      },
    ],
  }));

  const footerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.4],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <ThemedView surface="sunken" style={styles.root}>
      <Animated.View style={[styles.logoStage, logoStyle]}>
        <BrandLogo />
      </Animated.View>

      <Animated.View
        onLayout={(event) => {
          const height = event.nativeEvent.layout.height;

          if (height <= 0 || cardHeight.value > 0) {
            return;
          }

          cardHeight.value = height;
          progress.value = withDelay(
            holdMs,
            withTiming(1, {
              duration: moveMs,
              easing: moveEasing,
            })
          );
        }}
        style={[styles.cardStage, cardStyle]}
      >
        <ThemedView
          surface="raised"
          style={{
            borderTopLeftRadius: theme.semantic.radius.dialog,
            borderTopRightRadius: theme.semantic.radius.dialog,
            paddingTop: theme.semantic.space.section,
            paddingHorizontal: theme.semantic.space.inline.comfortable,
            paddingBottom: theme.semantic.space.section + insets.bottom,
          }}
        >
          <Stack space="comfortable">
            <Stack space="default">
              <ThemedText align="center" tone="brand" variant="title">
                Access, manage, and stay in control — wherever you are.
              </ThemedText>
              <ThemedText align="center" tone="muted">
                On your Desktop:{"\n"}
                Dentrooper 360 → register product → registration key{"\n"}
                and scan the QR code available.
              </ThemedText>
            </Stack>
            <Button
              icon={
                <SymbolView
                  name={{
                    ios: "qrcode",
                    android: "qr_code_2",
                    web: "qr_code_2",
                  }}
                  size={theme.semantic.size.icon}
                  tintColor={theme.palette.brand.default}
                />
              }
              label="Scan QR Code"
              onPress={() => router.push("/(auth)/qr-scanner" as Href)}
              size="lg"
              style={{
                backgroundColor: theme.palette.brand.subtle,
                borderRadius: theme.semantic.radius.card,
              }}
              tone="brand"
              variant="outline"
            />
          </Stack>
        </ThemedView>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.footer,
          {
            paddingBottom: theme.semantic.space.page + insets.bottom,
          },
          footerStyle,
        ]}
      >
        <SplashAttribution />
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
  },
  logoStage: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  cardStage: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
  },
  footer: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
  },
});
