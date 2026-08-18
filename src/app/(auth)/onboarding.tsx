import { Image } from "expo-image";
import { type Href, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Stack, ThemedText, ThemedView } from "@/components/ui";
import { useThemeTokens } from "@/theme";

const markLogo = require("../../assets/no-text-logo.svg");
const wordmarkLogo = require("../../assets/text-logo.svg");

export default function OnboardingScreen() {
  const router = useRouter();
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView surface="sunken" style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingTop: insets.top,
          paddingHorizontal: theme.semantic.space.inline.comfortable,
        }}
      >
        <Stack space="default" align="center">
          <Image
            accessibilityLabel="Dentrooper 360 mark"
            contentFit="contain"
            source={markLogo}
            style={{ width: 200, height: 200 }}
          />
          <Image
            accessibilityLabel="Dentrooper 360"
            contentFit="contain"
            source={wordmarkLogo}
            style={{ width: 280, height: 36 }}
          />
        </Stack>
      </View>

      <ThemedView
        surface="raised"
        style={{
          borderTopLeftRadius: theme.semantic.radius.dialog,
          borderTopRightRadius: theme.semantic.radius.dialog,
          paddingTop: theme.semantic.space.section,
          paddingHorizontal: theme.semantic.space.inline.comfortable,
          paddingBottom: theme.semantic.space.section + insets.bottom,
        }}
      >
        <Stack space="comfortable">
          <Stack space="default">
            <ThemedText align="center" tone="brand" variant="title">
              Access, manage, and stay in control — wherever you are.
            </ThemedText>
            <ThemedText align="center" tone="muted">
              On your Desktop:{"\n"}
              Dentrooper 360 → register product → registration key{"\n"}
              and scan the QR code available.
            </ThemedText>
          </Stack>
          <Button
            icon={
              <SymbolView
                name={{
                  ios: "qrcode",
                  android: "qr_code_2",
                  web: "qr_code_2",
                }}
                size={theme.semantic.size.icon}
                tintColor={theme.palette.brand.default}
              />
            }
            label="Scan QR Code"
            onPress={() => router.push("/(auth)/qr-scanner" as Href)}
            size="lg"
            style={{
              backgroundColor: theme.palette.brand.subtle,
              borderRadius: theme.semantic.radius.card,
            }}
            tone="brand"
            variant="outline"
          />
        </Stack>
      </ThemedView>
    </ThemedView>
  );
}
