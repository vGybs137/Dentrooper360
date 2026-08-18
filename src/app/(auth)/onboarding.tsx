import { type Href, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandLogo } from "@/components/app/BrandLogo";
import { SplashIntroLayout } from "@/components/app/SplashIntroLayout";
import { Button, Stack, ThemedText, ThemedView } from "@/components/ui";
import { hideNativeSplash } from "@/helpers/nativeSplash";
import {
  useAuthFlowSplashIntro,
  useAuthFlowIsLeaving,
  useBeginOnboardingExit,
} from "@/stores";
import { useThemeTokens } from "@/theme";

export default function OnboardingScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  const splashIntro = useAuthFlowSplashIntro();
  const isLeaving = useAuthFlowIsLeaving();
  const beginOnboardingExit = useBeginOnboardingExit();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    void hideNativeSplash();
  }, []);

  return (
    <SplashIntroLayout
      enabled
      intro={splashIntro}
      logo={<BrandLogo wordmarkStyle={splashIntro.dismissWordmarkStyle} />}
    >
      <ThemedView
        pointerEvents={isLeaving ? "none" : "auto"}
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
            disabled={isLeaving}
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
            onPress={() => {
              if (isLeaving) {
                return;
              }

              beginOnboardingExit();
              router.push({
                pathname: "/(auth)/qr-scanner",
                params: { from: "onboarding" },
              } as Href);
            }}
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
    </SplashIntroLayout>
  );
}
