import { type Href, useRouter } from "expo-router";
import { useEffect } from "react";

import { AuthBottomSheet } from "@/components/app/AuthBottomSheet";
import { BrandLogo } from "@/components/app/BrandLogo";
import { SplashIntroLayout } from "@/components/app/SplashIntroLayout";
import { Button, ThemedIcon, ThemedText, ThemedView } from "@/components/ui";
import { qrCodeIcon } from "@/constants";
import { hideNativeSplash } from "@/helpers/auth/nativeSplash";
import {
  useAuthFlowIsLeaving,
  useAuthFlowSplashIntro,
  useBeginOnboardingExit,
} from "@/stores";

export default function OnboardingScreen() {
  const router = useRouter();
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
        <ThemedView space="comfortable" variant="stack">
          <ThemedView space="default" variant="stack">
            <ThemedText align="center" tone="brand" variant="title">
              Access, manage, and stay in control — wherever you are.
            </ThemedText>
            <ThemedText align="center" tone="muted">
              On your Desktop:{"\n"}
              Dentrooper 360 → register product → registration key{"\n"}
              and scan the QR code available.
            </ThemedText>
          </ThemedView>
          <Button
            disabled={isLeaving}
            icon={<ThemedIcon name={qrCodeIcon} tone="brand" />}
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
            className="rounded-card"
            size="lg"
            tone="brand"
            variant="soft"
          />
        </ThemedView>
      </AuthBottomSheet>
    </SplashIntroLayout>
  );
}
