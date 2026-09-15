import { CameraView, useCameraPermissions } from "expo-camera";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";

import { BrandLogo, BRAND_MARK_SIZE, SplashFooter } from "@/components/app/BrandLogo";
import {
  FeedbackOverlay,
  type FeedbackOverlayProps,
} from "@/components/app/FeedbackOverlay";
import { LoginForm } from "@/components/app/LoginForm";
import { QrViewfinder } from "@/components/app/QrViewfinder";
import { ThemedView } from "@/components/ui";
import { getDeviceInfo, getOrCreateDeviceId } from "@/helpers/auth/deviceId";
import { isFromOnboarding } from "@/helpers/ui/routeParams";
import { useLoginLogoRestLayout } from "@/hooks/auth/useAuthLogoRestOffset";
import { usePairMutation } from "@/hooks/auth/usePairMutation";
import { useQrScannerMotion } from "@/hooks/auth/useQrScannerMotion";
import { useRestoreOnboarding } from "@/stores";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

const VIEWFINDER_MAX = 280;

export default function QrScannerScreen() {
  const { t } = useTranslation(["auth", "common"]);
  const router = useRouter();
  const { from, mode } = useLocalSearchParams<{
    from?: string | string[];
    mode?: string | string[];
  }>();
  const fromOnboarding = isFromOnboarding(from);
  const isAddClinic =
    (Array.isArray(mode) ? mode[0] : mode)?.toLowerCase() === "add";
  const native = useNativeColors();
  const restoreOnboarding = useRestoreOnboarding();
  const { width: windowWidth } = useWindowDimensions();
  const onLoginLogoRestLayout = useLoginLogoRestLayout();
  const scanInset = semantic.space.inline.default;
  const viewfinderSize = Math.min(
    windowWidth - semantic.space.inline.comfortable * 4,
    VIEWFINDER_MAX,
  );

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scanFeedback, setScanFeedback] = useState<FeedbackOverlayProps | null>(
    null,
  );
  const latestBarcodeRef = useRef<string | null>(null);

  const pairMutation = usePairMutation();

  const GUID_RE = useMemo(
    () =>
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    [],
  );

  const handleRequestCamera = useCallback(() => {
    if (cameraPermission?.granted) {
      return;
    }
    void requestCameraPermission();
  }, [cameraPermission?.granted, requestCameraPermission]);

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
    cancelScan,
    simulateScan,
  } = useQrScannerMotion({
    windowWidth,
    viewfinderSize,
    scanInset,
    onRestoreOnboarding: restoreOnboarding,
    onLeaveScanner: leaveScanner,
  });

  const dismissFeedback = useCallback(() => {
    setScanFeedback(null);
    latestBarcodeRef.current = null;
  }, []);

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
        setScanFeedback({
          stage: "error",
          title: t("auth:qr.invalidTitle"),
          message: t("auth:qr.invalidMessage"),
          onRetry: dismissFeedback,
          onDismiss: dismissFeedback,
          retryLabel: t("common:actions.tryAgain"),
          autoDismissMs: 3000,
        });
        return;
      }

      latestBarcodeRef.current = data;

      setScanFeedback({
        stage: "loading",
        title: t("auth:qr.pairingTitle"),
        message: t("auth:qr.pairingMessage"),
      });

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
          activate: !isAddClinic,
        });

        setScanFeedback({
          stage: "success",
          title: t("auth:qr.pairedTitle"),
          message: isAddClinic
            ? t("auth:qr.pairedAddClinicMessage")
            : t("auth:qr.pairedMessage"),
          autoContinueMs: 1500,
          onContinue: () => {
            setScanFeedback(null);
            if (isAddClinic) {
              router.replace({
                pathname: "/(auth)/login",
                params: { customerId: validated.customerId, from: "add-clinic" },
              } as Href);
              return;
            }
            simulateScan();
          },
        });
      } catch {
        latestBarcodeRef.current = null;
        setScanFeedback({
          stage: "error",
          title: t("auth:qr.failedTitle"),
          message: t("auth:qr.failedMessage"),
          onRetry: dismissFeedback,
          onDismiss: dismissFeedback,
          retryLabel: t("common:actions.tryAgain"),
        });
      }
    },
    [dismissFeedback, isAddClinic, pairMutation, router, simulateScan, status, t],
  );

  const frameColor =
    status === "paired"
      ? native.success.DEFAULT
      : native.brand.default;

  return (
    <ThemedView
      className="overflow-hidden"
      edges={[]}
      inset="none"
      keyboardAvoiding
      padBottom={false}
      pointerEvents="box-none"
      scroll={false}
      surface="default"
      transparent={fromOnboarding}
      variant="screen"
    >
      {fromOnboarding ? null : <SplashFooter />}
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
          onRequestCamera={handleRequestCamera}
          scanInset={scanInset}
          scanLineStyle={scanLineStyle}
          status={status}
          viewfinderSize={viewfinderSize}
        />
      </Animated.View>

      {scanFeedback ? <FeedbackOverlay {...scanFeedback} /> : null}
    </ThemedView>
  );
}
