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
import { keepNativeSplashVisible } from "@/helpers/nativeSplash";
import { useConnectivitySync } from "@/hooks/useConnectivitySync";
import { usePeriodicSync } from "@/hooks/usePeriodicSync";
import { useTokenRefresh } from "@/hooks/useTokenRefresh";
import { QueryProvider } from "@/providers/QueryProvider";
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
          <ThemeEffects />
          <BottomSheetModalProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" options={{ animation: "none" }} />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="appointments/search" />
              <Stack.Screen name="appointments/[id]" />
              <Stack.Screen name="patients/search" />
              <Stack.Screen name="patients/[id]" />
              <Stack.Screen name="recalls/[id]" />
            </Stack>
            <AddAppointmentSheet />
          </BottomSheetModalProvider>
        </QueryProvider>
      </BlurTargetView>
      <ThemeSwitchOverlay blurTargetRef={blurTargetRef} />
    </GestureHandlerRootView>
  );
}

export default RootLayout;
