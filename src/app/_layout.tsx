import "react-native-gesture-handler";
import "react-native-get-random-values";
import "../../global.css";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AddAppointmentSheet } from "@/components/schedule/addAppointment";
import { keepNativeSplashVisible } from "@/helpers/nativeSplash";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/theme";

keepNativeSplashVisible();

export default function RootLayout() {
  // usePeriodicSync();
  // useTokenRefresh();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <ThemeProvider>
          <BottomSheetModalProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" options={{ animation: "none" }} />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="appointments/[id]" />
              <Stack.Screen name="patients/[id]" />
              <Stack.Screen name="recalls/[id]" />
            </Stack>
            <AddAppointmentSheet />
          </BottomSheetModalProvider>
        </ThemeProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
