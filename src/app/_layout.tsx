import "../../global.css";
import "react-native-get-random-values";
import "react-native-gesture-handler";

import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { keepNativeSplashVisible } from "@/helpers/nativeSplash";
import { usePeriodicSync } from "@/hooks/usePeriodicSync";
import { useTokenRefresh } from "@/hooks/useTokenRefresh";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/theme";

keepNativeSplashVisible();

export default function RootLayout() {
  usePeriodicSync();
  useTokenRefresh();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <ThemeProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" options={{ animation: "none" }} />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="appointments/[id]" />
            <Stack.Screen name="patients/[id]" />
            <Stack.Screen name="recalls/[id]" />
          </Stack>
        </ThemeProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
