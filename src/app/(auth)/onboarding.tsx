import { type Href, useRouter } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("auth");
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
              {t("onboarding.headline")}
            </ThemedText>
            <ThemedText align="center" tone="muted">
              {t("onboarding.instructions")}
            </ThemedText>
          </ThemedView>
          <Button
            disabled={isLeaving}
            icon={<ThemedIcon name={qrCodeIcon} tone="brand" />}
            label={t("onboarding.scanQr")}
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
