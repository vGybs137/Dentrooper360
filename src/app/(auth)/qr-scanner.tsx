import { CameraView, useCameraPermissions } from "expo-camera";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";

import {
  AddClinicAccountChooser,
  type AddClinicAccountOption,
} from "@/components/app/AddClinicAccountChooser";
import { BrandLogo, BRAND_MARK_SIZE, SplashFooter } from "@/components/app/BrandLogo";
import {
  FeedbackOverlay,
  type FeedbackOverlayProps,
} from "@/components/app/FeedbackOverlay";
import { LoginForm } from "@/components/app/LoginForm";
import { QrViewfinder } from "@/components/app/QrViewfinder";
import { ThemedView } from "@/components/ui";
import { queryKeys } from "@/constants/queryKeys";
import { canonicalCustomerId, sameCustomerId } from "@/helpers/auth/customerId";
import { getDeviceInfo, getOrCreateDeviceId } from "@/helpers/auth/deviceId";
import { parseValidatedQrPayload } from "@/helpers/auth/parseValidatedQrPayload";
import { isFromOnboarding } from "@/helpers/ui/routeParams";
import { useLoginLogoRestLayout } from "@/hooks/auth/useAuthLogoRestOffset";
import { usePairMutation } from "@/hooks/auth/usePairMutation";
import { useQrScannerMotion } from "@/hooks/auth/useQrScannerMotion";
import { useClinicsList } from "@/hooks/auth/useClinicsList";
import { useCustomerId, useRestoreOnboarding } from "@/stores";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

const VIEWFINDER_MAX = 280;

function clinicChooserLabel(
  customerId: string,
  displayName: string | null | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const name = displayName?.trim();
  if (name) {
    return name;
  }
  return t("settings:clinics.fallbackName", {
    idPrefix: customerId.length > 8 ? customerId.slice(0, 8) : customerId,
  });
}

export default function QrScannerScreen() {
  const { t } = useTranslation(["auth", "common", "settings"]);
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
  const activeCustomerId = useCustomerId();
  const clinicsQuery = useClinicsList();
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
  const [pairedCustomerId, setPairedCustomerId] = useState<string | null>(null);
  const [selectedLoginCustomerId, setSelectedLoginCustomerId] = useState<
    string | null
  >(null);
  const latestBarcodeRef = useRef<string | null>(null);

  const pairMutation = usePairMutation();
  const queryClient = useQueryClient();

  const handleRequestCamera = useCallback(() => {
    if (cameraPermission?.granted) {
      return;
    }
    void requestCameraPermission();
  }, [cameraPermission?.granted, requestCameraPermission]);

  const leaveScanner = useCallback(() => {
    if (fromOnboarding || isAddClinic) {
      if (router.canGoBack()) {
        router.back();
        return;
      }
      if (isAddClinic) {
        router.replace("/(tabs)/settings" as Href);
        return;
      }
      router.back();
      return;
    }

    router.replace("/(auth)/login" as Href);
  }, [fromOnboarding, isAddClinic, router]);

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

  const accountOptions = useMemo((): AddClinicAccountOption[] => {
    if (!pairedCustomerId) {
      return [];
    }

    const clinics = clinicsQuery.data?.clinics ?? [];
    const options: AddClinicAccountOption[] = [];

    if (activeCustomerId) {
      const current = clinics.find((clinic) =>
        sameCustomerId(clinic.customerId, activeCustomerId),
      );
      options.push({
        customerId: activeCustomerId,
        label: t("auth:qr.currentAccountLabel", {
          clinic: clinicChooserLabel(
            activeCustomerId,
            current?.clinicDisplayName,
            t,
          ),
        }),
        isCurrent: true,
      });
    }

    if (!sameCustomerId(pairedCustomerId, activeCustomerId)) {
      const paired = clinics.find((clinic) =>
        sameCustomerId(clinic.customerId, pairedCustomerId),
      );
      options.push({
        customerId: pairedCustomerId,
        label: t("auth:qr.newAccountLabel", {
          clinic: clinicChooserLabel(
            pairedCustomerId,
            paired?.clinicDisplayName,
            t,
          ),
        }),
        isNew: true,
      });
    }

    return options;
  }, [activeCustomerId, clinicsQuery.data?.clinics, pairedCustomerId, t]);

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
        const pairedId =
          canonicalCustomerId(validated.customerId) ?? validated.customerId;

        await pairMutation.mutateAsync({
          customerId: validated.customerId,
          productId: validated.productId,
          deviceId,
          deviceName,
          platform,
          version,
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
              setPairedCustomerId(pairedId);
              setSelectedLoginCustomerId(null);
              void queryClient.invalidateQueries({
                queryKey: queryKeys.auth.clinics,
              });
              void queryClient.invalidateQueries({
                queryKey: queryKeys.auth.clinicRegistry,
              });
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
    [
      dismissFeedback,
      isAddClinic,
      pairMutation,
      queryClient,
      simulateScan,
      status,
      t,
    ],
  );

  const frameColor =
    status === "paired"
      ? native.success.DEFAULT
      : native.brand.default;

  const showAddChooser =
    isAddClinic && status === "paired" && selectedLoginCustomerId == null;
  const showLogin =
    status === "paired" &&
    (!isAddClinic || selectedLoginCustomerId != null);

  const loginLogo = fromOnboarding ? (
    <View style={{ height: BRAND_MARK_SIZE }} />
  ) : (
    <View className="items-center" onLayout={onLoginLogoRestLayout}>
      <BrandLogo showWordmark={false} />
    </View>
  );

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
      {showAddChooser ? (
        <AddClinicAccountChooser
          contentStyle={loginStyle}
          onCancel={leaveScanner}
          onSelect={setSelectedLoginCustomerId}
          options={accountOptions}
        />
      ) : null}
      {showLogin ? (
        <LoginForm
          contentStyle={loginStyle}
          customerId={
            isAddClinic ? selectedLoginCustomerId : undefined
          }
          logo={loginLogo}
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
