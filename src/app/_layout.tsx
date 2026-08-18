import "../../global.css";

import { Stack } from "expo-router";

import { ThemeProvider } from "@/theme";

export default function RootLayout() {
  return (
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
  );
}
