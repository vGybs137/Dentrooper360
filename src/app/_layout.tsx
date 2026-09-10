import "react-native-gesture-handler";
import "react-native-get-random-values";
import "../../global.css";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { BlurTargetView } from "expo-blur";
import { Stack } from "expo-router";
import { useRef } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AddAppointmentSheet } from "@/components/schedule/addAppointment";
import { AddPatientSheet } from "@/components/patients/addPatient";
import { ClinicSwitchOverlay } from "@/components/app/ClinicSwitchOverlay";
import { ConnectivitySnackbar } from "@/components/app/ConnectivitySnackbar";
import { keepNativeSplashVisible } from "@/helpers/auth/nativeSplash";
import { useConnectivitySync } from "@/hooks/sync/useConnectivitySync";
import { usePeriodicSync } from "@/hooks/sync/usePeriodicSync";
import { useTokenRefresh } from "@/hooks/auth/useTokenRefresh";
import {
  ClinicDatabaseBoundary,
  useIsOnClinicAppRoute,
} from "@/providers/ClinicDatabaseBoundary";
import { QueryProvider } from "@/providers/QueryProvider";
import {
  ClinicSessionProvider,
  useClinicSession,
} from "@/providers/ClinicSessionProvider";
import { ThemeEffects, ThemeSwitchOverlay } from "@/theme";

keepNativeSplashVisible();

function RootLayout() {
  const blurTargetRef = useRef<View>(null);
  usePeriodicSync();
  useConnectivitySync();
  useTokenRefresh();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
        <QueryProvider>
          <ClinicSessionProvider>
            <ThemeEffects />
            <BottomSheetModalProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" options={{ animation: "none" }} />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="appointments" />
                <Stack.Screen name="patients" />
                <Stack.Screen name="payments" />
                <Stack.Screen name="recalls" />
              </Stack>
              <ClinicReadySheets />
              <ConnectivitySnackbar />
              <ClinicSwitchOverlay />
            </BottomSheetModalProvider>
          </ClinicSessionProvider>
        </QueryProvider>
      </BlurTargetView>
      <ThemeSwitchOverlay blurTargetRef={blurTargetRef} />
    </GestureHandlerRootView>
  );
}

/** Sheets call useDatabase(); mount only on clinic routes with a ready DB. */
function ClinicReadySheets() {
  const onClinicRoute = useIsOnClinicAppRoute();
  const { isDatabaseReady } = useClinicSession();
  if (!onClinicRoute || !isDatabaseReady) {
    return null;
  }

  return (
    <ClinicDatabaseBoundary>
      <AddAppointmentSheet />
      <AddPatientSheet />
    </ClinicDatabaseBoundary>
  );
}

export default RootLayout;
