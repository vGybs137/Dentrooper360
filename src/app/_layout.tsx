import "react-native-gesture-handler";
import "react-native-get-random-values";
import "../../global.css";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AddAppointmentSheet } from "@/components/schedule/addAppointment";
import { keepNativeSplashVisible } from "@/helpers/nativeSplash";
import { useConnectivitySync } from "@/hooks/useConnectivitySync";
import { usePeriodicSync } from "@/hooks/usePeriodicSync";
import { useTokenRefresh } from "@/hooks/useTokenRefresh";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeEffects } from "@/theme";

import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "https://e4ec2c8840a2bbf06e3d0d99bef01776@o4511971193520128.ingest.us.sentry.io/4511971208396800",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

keepNativeSplashVisible();

function RootLayout() {
  usePeriodicSync();
  useConnectivitySync();
  useTokenRefresh();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <ThemeEffects />
        <BottomSheetModalProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" options={{ animation: "none" }} />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="appointments/search" />
            <Stack.Screen name="appointments/[id]" />
            <Stack.Screen name="patients/[id]" />
            <Stack.Screen name="recalls/[id]" />
          </Stack>
          <AddAppointmentSheet />
        </BottomSheetModalProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
