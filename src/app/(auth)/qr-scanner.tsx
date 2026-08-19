import { CameraView, useCameraPermissions } from "expo-camera";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";

import { AuthScreenShell } from "@/components/app/AuthScreenShell";
import { BRAND_MARK_SIZE, BrandLogo } from "@/components/app/BrandLogo";
import { FeedbackOverlay } from "@/components/app/FeedbackOverlay";
import { LoginForm } from "@/components/app/LoginForm";
import { QrViewfinder } from "@/components/app/QrViewfinder";
import { getDeviceInfo, getOrCreateDeviceId } from "@/helpers/deviceId";
import { isFromOnboarding } from "@/helpers/routeParams";
import { useLoginLogoRestLayout } from "@/hooks/useAuthLogoRestOffset";
import { usePairMutation } from "@/hooks/usePairMutation";
import { useQrScannerMotion } from "@/hooks/useQrScannerMotion";
import { useRestoreOnboarding } from "@/stores";
import { useThemeTokens } from "@/theme";

const VIEWFINDER_MAX = 280;

export default function QrScannerScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string | string[] }>();
  const fromOnboarding = isFromOnboarding(from);
  const theme = useThemeTokens();
  const restoreOnboarding = useRestoreOnboarding();
  const { width: windowWidth } = useWindowDimensions();
  const onLoginLogoRestLayout = useLoginLogoRestLayout();
  const scanInset = theme.semantic.space.inline.default;
  const viewfinderSize = Math.min(
    windowWidth - theme.semantic.space.inline.comfortable * 4,
    VIEWFINDER_MAX,
  );

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scanError, setScanError] = useState<string | null>(null);
  const latestBarcodeRef = useRef<string | null>(null);

  const pairMutation = usePairMutation();

  const GUID_RE = useMemo(
    () =>
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    [],
  );

  useEffect(() => {
    if (cameraPermission === null) {
      void requestCameraPermission();
    }
  }, [cameraPermission, requestCameraPermission]);

  type ValidatedQrPayload = {
    customerId: string;
    productId: string;
    xApiKey: string;
  };

  function parseValidatedQrPayload(data: string): ValidatedQrPayload | null {
    if (!data) {
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      return null;
    }

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    const registrationKey = record.registration_key;
    const xApiKey = record.x_api_key;

    if (typeof registrationKey !== "string" || typeof xApiKey !== "string") {
      return null;
    }

    if (!GUID_RE.test(xApiKey)) {
      return null;
    }

    const [customerId, productId] = registrationKey.split("|");
    if (!customerId || !productId) {
      return null;
    }

    if (!GUID_RE.test(customerId) || !GUID_RE.test(productId)) {
      return null;
    }

    return { customerId, productId, xApiKey };
  }

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

  const handleBarcodeScanned = useCallback(
    async (result: { data?: string | null } | null) => {
      if (status !== "ready") {
        return;
      }

      const data = result?.data;
      if (!data) {
        return;
      }

      if (latestBarcodeRef.current === data || pairMutation.isPending) {
        return;
      }

      const validated = parseValidatedQrPayload(data);
      if (!validated) {
        latestBarcodeRef.current = data;
        setScanError("The scanned QR code is not a valid registration code.");
        return;
      }

      latestBarcodeRef.current = data;

      try {
        const deviceId = await getOrCreateDeviceId();
        const { deviceName, platform, version } = getDeviceInfo();

        await pairMutation.mutateAsync({
          customerId: validated.customerId,
          productId: validated.productId,
          deviceId,
          deviceName,
          platform,
          version,
          xApiKey: validated.xApiKey,
        });

        simulateScan();
      } catch {
        latestBarcodeRef.current = null;
        setScanError("Pairing failed. Please try scanning again.");
      }
    },
    [pairMutation, parseValidatedQrPayload, simulateScan, status],
  );

  const dismissScanError = useCallback(() => {
    setScanError(null);
    latestBarcodeRef.current = null;
  }, []);

  const frameColor =
    status === "paired"
      ? theme.palette.success.DEFAULT
      : theme.palette.brand.default;

  return (
    <AuthScreenShell
      footerVisibility={fromOnboarding ? "hidden" : "always"}
      pointerEvents="box-none"
      transparent={fromOnboarding}
    >
      {status === "paired" ? (
        <LoginForm
          contentStyle={loginStyle}
          logo={
            fromOnboarding ? (
              <View style={{ height: BRAND_MARK_SIZE }} />
            ) : (
              <View className="items-center" onLayout={onLoginLogoRestLayout}>
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
          cameraPreview={
            cameraPermission?.granted ? (
              <CameraView
                style={StyleSheet.absoluteFill}
                onBarcodeScanned={
                  status === "ready" && !pairMutation.isPending
                    ? handleBarcodeScanned
                    : undefined
                }
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"],
                }}
              />
            ) : undefined
          }
          frameColor={frameColor}
          onCancel={cancelScan}
          pairedMarkStyle={pairedMarkStyle}
          scanInset={scanInset}
          scanLineStyle={scanLineStyle}
          status={status}
          viewfinderSize={viewfinderSize}
        />
      </Animated.View>

      {scanError ? (
        <FeedbackOverlay
          autoDismissMs={3000}
          message={scanError}
          onDismiss={dismissScanError}
          onRetry={dismissScanError}
          retryLabel="Try again"
          stage="error"
          title="Invalid QR Code"
        />
      ) : null}
    </AuthScreenShell>
  );
}
