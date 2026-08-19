import { type Href, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect } from "react";

import { AuthBottomSheet } from "@/components/app/AuthBottomSheet";
import { BrandLogo } from "@/components/app/BrandLogo";
import { SplashIntroLayout } from "@/components/app/SplashIntroLayout";
import { Button, Stack, ThemedText } from "@/components/ui";
import { qrCodeIcon } from "@/constants";
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

  useEffect(() => {
    void hideNativeSplash();
  }, []);

  return (
    <SplashIntroLayout
      intro={splashIntro}
      logo={<BrandLogo wordmarkStyle={splashIntro.dismissWordmarkStyle} />}
    >
      <AuthBottomSheet pointerEvents={isLeaving ? "none" : "auto"}>
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
                name={qrCodeIcon}
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
      </AuthBottomSheet>
    </SplashIntroLayout>
  );
}
