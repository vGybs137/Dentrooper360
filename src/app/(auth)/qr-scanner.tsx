import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";
import { useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";

import { AuthScreenShell } from "@/components/app/AuthScreenShell";
import { BRAND_MARK_SIZE, BrandLogo } from "@/components/app/BrandLogo";
import { LoginForm } from "@/components/app/LoginForm";
import { QrViewfinder } from "@/components/app/QrViewfinder";
import { DEMO_CUSTOMER_ID } from "@/constants";
import { isFromOnboarding } from "@/helpers/routeParams";
import { useQrScannerMotion } from "@/hooks/useQrScannerMotion";
import { useAuthStore, useRestoreOnboarding } from "@/stores";
import { useThemeTokens } from "@/theme";

const VIEWFINDER_MAX = 280;

export default function QrScannerScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string | string[] }>();
  const fromOnboarding = isFromOnboarding(from);
  const theme = useThemeTokens();
  const restoreOnboarding = useRestoreOnboarding();
  const { width: windowWidth } = useWindowDimensions();
  const setCustomerId = useAuthStore((state) => state.setCustomerId);
  const scanInset = theme.semantic.space.inline.default;
  const viewfinderSize = Math.min(
    windowWidth - theme.semantic.space.inline.comfortable * 4,
    VIEWFINDER_MAX,
  );

  const leaveScanner = useCallback(() => {
    if (fromOnboarding) {
      router.back();
      return;
    }

    router.replace("/(auth)/login" as Href);
  }, [fromOnboarding, router]);

  const {
    status,
    cameraStyle,
    loginStyle,
    scanLineStyle,
    pairedMarkStyle,
    cancelScan,
    simulateScan,
  } = useQrScannerMotion({
    windowWidth,
    viewfinderSize,
    scanInset,
    onRestoreOnboarding: restoreOnboarding,
    onLeaveScanner: leaveScanner,
  });

  const frameColor =
    status === "paired"
      ? theme.palette.success.DEFAULT
      : theme.palette.brand.default;

  function handleSimulateScan() {
    simulateScan();
    setCustomerId(DEMO_CUSTOMER_ID);
  }

  return (
    <AuthScreenShell
      pointerEvents="box-none"
      showFooter={!fromOnboarding}
      transparent={fromOnboarding}
    >
      {status === "paired" ? (
        <LoginForm
          contentStyle={loginStyle}
          logo={
            fromOnboarding ? (
              <View style={{ height: BRAND_MARK_SIZE }} />
            ) : (
              <View className="items-center">
                <BrandLogo showWordmark={false} />
              </View>
            )
          }
        />
      ) : null}

      <Animated.View
        className="absolute inset-0 z-overlay items-center justify-center"
        pointerEvents="box-none"
        style={cameraStyle}
      >
        <QrViewfinder
          frameColor={frameColor}
          onCancel={cancelScan}
          onSimulateScan={handleSimulateScan}
          pairedMarkStyle={pairedMarkStyle}
          scanInset={scanInset}
          scanLineStyle={scanLineStyle}
          status={status}
          viewfinderSize={viewfinderSize}
        />
      </Animated.View>
    </AuthScreenShell>
  );
}
