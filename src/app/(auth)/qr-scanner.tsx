import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import {
  BRAND_MARK_SIZE,
  BrandLogo,
  SplashFooter,
} from "@/components/app/BrandLogo";
import { LoginForm } from "@/components/app/LoginForm";
import { Button, Stack, ThemedView } from "@/components/ui";
import { isFromOnboarding } from "@/helpers/routeParams";
import {
  useAuthSlideTiming,
  useSlideFromRightStyle,
  useSlideFromRightToLeftStyle,
} from "@/hooks/useAuthMotion";
import { useAuthStore, useRestoreOnboarding } from "@/stores";
import { useThemeTokens } from "@/theme";

const DEMO_CUSTOMER_ID = "C69B1B73-C143-4B55-8859-1A22EED3C6EA";
const VIEWFINDER_MAX = 280;

type ScanStatus = "ready" | "paired";

function ViewfinderCorner({
  color,
  radius,
  size,
  thickness,
  placement,
}: {
  color: string;
  radius: number;
  size: number;
  thickness: number;
  placement: "tl" | "tr" | "bl" | "br";
}) {
  const isTop = placement.startsWith("t");
  const isLeft = placement.endsWith("l");

  return (
    <View
      style={{
        position: "absolute",
        top: isTop ? 0 : undefined,
        bottom: isTop ? undefined : 0,
        left: isLeft ? 0 : undefined,
        right: isLeft ? undefined : 0,
        width: size,
        height: size,
        borderColor: color,
        borderTopWidth: isTop ? thickness : 0,
        borderBottomWidth: isTop ? 0 : thickness,
        borderLeftWidth: isLeft ? thickness : 0,
        borderRightWidth: isLeft ? 0 : thickness,
        borderTopLeftRadius: placement === "tl" ? radius : 0,
        borderTopRightRadius: placement === "tr" ? radius : 0,
        borderBottomLeftRadius: placement === "bl" ? radius : 0,
        borderBottomRightRadius: placement === "br" ? radius : 0,
      }}
    />
  );
}

export default function QrScannerScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string | string[] }>();
  const fromOnboarding = isFromOnboarding(from);
  const theme = useThemeTokens();
  const restoreOnboarding = useRestoreOnboarding();
  const slideTiming = useAuthSlideTiming();
  const { width: windowWidth } = useWindowDimensions();
  const setCustomerId = useAuthStore((state) => state.setCustomerId);
  const [status, setStatus] = useState<ScanStatus>("ready");
  const scanLine = useSharedValue(0);
  const pairedMark = useSharedValue(0);
  const enter = useSharedValue(0);
  const handoff = useSharedValue(0);
  const scanInset = theme.semantic.space.inline.default;
  const viewfinderSize = Math.min(
    windowWidth - theme.semantic.space.inline.comfortable * 4,
    VIEWFINDER_MAX,
  );
  const frameColor =
    status === "paired"
      ? theme.palette.success.DEFAULT
      : theme.palette.brand.default;

  useEffect(() => {
    enter.value = withTiming(1, slideTiming);
  }, [enter, slideTiming]);

  useEffect(() => {
    if (status !== "ready") {
      cancelAnimation(scanLine);
      return;
    }

    scanLine.value = 0;
    scanLine.value = withRepeat(
      withTiming(1, {
        duration: theme.semantic.motion.overlay.duration * 4,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(scanLine);
    };
  }, [scanLine, status, theme.semantic.motion.overlay.duration]);

  useEffect(() => {
    if (status !== "paired") {
      pairedMark.value = 0;
      return;
    }

    pairedMark.value = withTiming(
      1,
      {
        duration: theme.semantic.motion.enter.duration,
        easing: Easing.out(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(scheduleHandoff)();
        }
      },
    );
  }, [pairedMark, status, theme.semantic.motion.enter.duration]);

  const cameraStyle = useSlideFromRightToLeftStyle(
    enter,
    handoff,
    windowWidth,
  );

  const loginStyle = useSlideFromRightStyle(handoff, windowWidth);

  const scanLineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scanLine.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
    transform: [
      {
        translateY: interpolate(
          scanLine.value,
          [0, 1],
          [scanInset, viewfinderSize - scanInset - 2],
        ),
      },
    ],
  }));

  const pairedMarkStyle = useAnimatedStyle(() => ({
    opacity: pairedMark.value,
    transform: [{ scale: interpolate(pairedMark.value, [0, 1], [0.72, 1]) }],
  }));

  function scheduleHandoff() {
    setTimeout(() => {
      startHandoff();
    }, theme.semantic.motion.normal.duration);
  }

  function startHandoff() {
    handoff.value = withTiming(1, slideTiming);
  }

  function leaveScanner() {
    if (fromOnboarding) {
      router.back();
      return;
    }

    router.replace("/(auth)/login" as Href);
  }

  function cancelScan() {
    if (status !== "ready") {
      return;
    }

    restoreOnboarding();
    enter.value = withTiming(
      0,
      slideTiming,
      (finished) => {
        if (finished) {
          runOnJS(leaveScanner)();
        }
      },
    );
  }

  function pairDevice() {
    if (status !== "ready") {
      return;
    }

    setStatus("paired");
    setCustomerId(DEMO_CUSTOMER_ID);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      pointerEvents="box-none"
      style={styles.root}
    >
      <ThemedView
        pointerEvents="box-none"
        surface="sunken"
        style={[styles.root, fromOnboarding ? styles.overlay : null]}
      >
        {fromOnboarding ? null : <SplashFooter />}

        <LoginForm
          contentStyle={loginStyle}
          logo={
            fromOnboarding ? (
              <View style={{ height: BRAND_MARK_SIZE }} />
            ) : (
              <View style={styles.logoSlot}>
                <BrandLogo showWordmark={false} />
              </View>
            )
          }
        />

        <Animated.View
          pointerEvents="box-none"
          style={[styles.stage, cameraStyle]}
        >
          <Stack space="comfortable" align="center">
            <Pressable
              accessibilityLabel="Scan clinic QR code"
              accessibilityRole="button"
              disabled={status !== "ready"}
              onPress={pairDevice}
            >
              <View
                style={{
                  width: viewfinderSize,
                  height: viewfinderSize,
                  backgroundColor: theme.palette.brand.subtle,
                  borderRadius: theme.semantic.radius.overlay,
                  overflow: "hidden",
                }}
              >
                {status === "ready" ? (
                  <>
                    <View style={styles.mark}>
                      <SymbolView
                        name={{
                          ios: "qrcode",
                          android: "qr_code_2",
                          web: "qr_code_2",
                        }}
                        size={theme.semantic.size["icon-lg"] * 2}
                        tintColor={theme.palette.brand.default}
                      />
                    </View>
                    <Animated.View
                      style={[
                        styles.scanLine,
                        {
                          left: scanInset,
                          right: scanInset,
                          backgroundColor: theme.palette.brand.default,
                        },
                        scanLineStyle,
                      ]}
                    />
                  </>
                ) : (
                  <Animated.View style={[styles.mark, pairedMarkStyle]}>
                    <SymbolView
                      name={{
                        ios: "checkmark.circle.fill",
                        android: "check_circle",
                        web: "check_circle",
                      }}
                      size={theme.semantic.size["icon-lg"] * 2}
                      tintColor={theme.palette.success.DEFAULT}
                    />
                  </Animated.View>
                )}
                <ViewfinderCorner
                  color={frameColor}
                  placement="tl"
                  radius={theme.semantic.radius.overlay}
                  size={theme.semantic.size["icon-lg"]}
                  thickness={theme.semantic.borderWidth.strong}
                />
                <ViewfinderCorner
                  color={frameColor}
                  placement="tr"
                  radius={theme.semantic.radius.overlay}
                  size={theme.semantic.size["icon-lg"]}
                  thickness={theme.semantic.borderWidth.strong}
                />
                <ViewfinderCorner
                  color={frameColor}
                  placement="bl"
                  radius={theme.semantic.radius.overlay}
                  size={theme.semantic.size["icon-lg"]}
                  thickness={theme.semantic.borderWidth.strong}
                />
                <ViewfinderCorner
                  color={frameColor}
                  placement="br"
                  radius={theme.semantic.radius.overlay}
                  size={theme.semantic.size["icon-lg"]}
                  thickness={theme.semantic.borderWidth.strong}
                />
              </View>
            </Pressable>
            <Button
              disabled={status !== "ready"}
              label="Cancel"
              onPress={cancelScan}
              size="lg"
              style={{
                width: viewfinderSize,
                borderRadius: theme.semantic.radius.card,
              }}
              tone="alert"
              variant="soft"
            />
          </Stack>
        </Animated.View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
  },
  overlay: {
    backgroundColor: "transparent",
  },
  logoSlot: {
    alignItems: "center",
  },
  stage: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  scanLine: {
    position: "absolute",
    height: 2,
  },
  mark: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
