import "../../global.css";

import { Stack } from "expo-router";

import { keepNativeSplashVisible } from "@/helpers/nativeSplash";
import { usePeriodicSync } from "@/hooks/usePeriodicSync";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/theme";

keepNativeSplashVisible();

export default function RootLayout() {
  usePeriodicSync();
  return (
    <QueryProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="appointments/[id]" />
          <Stack.Screen name="patients/[id]" />
          <Stack.Screen name="recalls/[id]" />
        </Stack>
      </ThemeProvider>
    </QueryProvider>
  );
}
