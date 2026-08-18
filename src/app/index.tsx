import { useState } from "react";

import {
  Button,
  Card,
  Container,
  Screen,
  Stack,
  TextField,
  ThemedText,
  ThemedView,
} from "@/components/ui";
import { useAppTheme } from "@/theme";

export default function Index() {
  const { mode, resolved, setMode, theme } = useAppTheme();
  const [notes, setNotes] = useState("");

  return (
    <Screen scroll>
      <Container>
        <Stack space="comfortable">
          <Stack space="compact">
            <ThemedText variant="display">Dentrooper360 UI</ThemedText>
            <ThemedText tone="muted">
              Reusable themed primitives backed by shared tokens for both
              NativeWind classes and direct React Native styles.
            </ThemedText>
          </Stack>

          <Card>
            <Stack space="default">
              <ThemedText variant="title">Theme control</ThemedText>
              <ThemedText tone="muted">
                Current mode: {mode} ({resolved})
              </ThemedText>
              <Stack direction="row" space="compact">
                <Button
                  label="System"
                  onPress={() => setMode("system")}
                  tone="neutral"
                  variant={mode === "system" ? "solid" : "outline"}
                />
                <Button
                  label="Light"
                  onPress={() => setMode("light")}
                  tone="brand"
                  variant={mode === "light" ? "solid" : "outline"}
                />
                <Button
                  label="Dark"
                  onPress={() => setMode("dark")}
                  tone="accent"
                  variant={mode === "dark" ? "solid" : "outline"}
                />
              </Stack>
            </Stack>
          </Card>

          <Card>
            <Stack space="default">
              <ThemedText variant="title">Type and tones</ThemedText>
              <Stack space="compact">
                <ThemedText variant="label">Label text</ThemedText>
                <ThemedText variant="body">Body text built from semantic typography tokens.</ThemedText>
                <ThemedText variant="title" tone="brand">
                  Branded title
                </ThemedText>
                <ThemedText variant="display" tone="accent">
                  Accent display
                </ThemedText>
              </Stack>
            </Stack>
          </Card>

          <Card>
            <Stack space="default">
              <ThemedText variant="title">Surfaces and actions</ThemedText>
              <Stack direction="row" space="compact">
                <ThemedView
                  className="flex-1"
                  inset="default"
                  radius="card"
                  surface="sunken"
                >
                  <ThemedText variant="label">Sunken</ThemedText>
                </ThemedView>
                <ThemedView
                  className="flex-1"
                  inset="default"
                  radius="card"
                  surface="inverse"
                >
                  <ThemedText tone="inverse" variant="label">
                    Inverse
                  </ThemedText>
                </ThemedView>
              </Stack>
              <Stack direction="row" space="compact">
                <Button label="Primary" tone="brand" />
                <Button label="Soft" tone="success" variant="soft" />
                <Button label="Ghost" tone="alert" variant="ghost" />
              </Stack>
            </Stack>
          </Card>

          <Card>
            <Stack space="default">
              <ThemedText variant="title">Input primitive</ThemedText>
              <TextField
                hint="This field uses runtime theme colors and semantic sizing."
                label="Clinical notes"
                multiline
                onChangeText={setNotes}
                placeholder="Add a patient note..."
                value={notes}
              />
            </Stack>
          </Card>

          <Card
            style={{
              backgroundColor: theme.colors.brandSubtle,
              borderColor: theme.colors.brand,
            }}
          >
            <Stack space="compact">
              <ThemedText tone="brand" variant="title">
                Mixed styling API
              </ThemedText>
              <ThemedText>
                Components accept semantic props for consistency and still leave
                room for `className` or direct style overrides when you need
                them.
              </ThemedText>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </Screen>
  );
}
