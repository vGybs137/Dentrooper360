import React from "react";
import { Platform } from "react-native";
import { useSegments } from "expo-router";

import { Card, Container, Screen, Stack, ThemedText } from "@/components/ui";
import { BOTTOM_TAB_INSET } from "@/constants/navigation";

export type AppScreenShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  scroll?: boolean;
};

export function AppScreenShell({
  eyebrow,
  title,
  description,
  children,
  scroll = true,
}: AppScreenShellProps) {
  const segments = useSegments();
  const bottomInset =
    Platform.OS === "web" && segments[0] === "(tabs)" ? BOTTOM_TAB_INSET : 0;

  return (
    <Screen bottomInset={bottomInset} scroll={scroll}>
      <Container>
        <Stack space="comfortable">
          <Stack space="compact">
            {eyebrow ? (
              <ThemedText tone="brand" variant="label">
                {eyebrow}
              </ThemedText>
            ) : null}
            <ThemedText variant="display">{title}</ThemedText>
            <ThemedText tone="muted">{description}</ThemedText>
          </Stack>

          {children}
        </Stack>
      </Container>
    </Screen>
  );
}

export function AppSectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <Stack space="default">
        <Stack space="compact">
          <ThemedText variant="title">{title}</ThemedText>
          {description ? <ThemedText tone="muted">{description}</ThemedText> : null}
        </Stack>
        {children}
      </Stack>
    </Card>
  );
}
