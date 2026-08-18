import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="onboarding"
        options={{ animation: "none", freezeOnBlur: false }}
      />
      <Stack.Screen name="login" options={{ animation: "none" }} />
      <Stack.Screen
        name="qr-scanner"
        options={{
          animation: "none",
          presentation: "transparentModal",
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
    </Stack>
  );
}
