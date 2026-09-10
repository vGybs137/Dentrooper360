import { DatabaseProvider } from "@nozbe/watermelondb/react";
import { useSegments } from "expo-router";
import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui";
import { useClinicSession } from "@/providers/ClinicSessionProvider";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

const CLINIC_APP_SEGMENTS = new Set([
  "(tabs)",
  "appointments",
  "patients",
  "payments",
  "recalls",
]);

export function isClinicAppSegment(
  segment: string | undefined,
): segment is string {
  return Boolean(segment && CLINIC_APP_SEGMENTS.has(segment));
}

export function useIsOnClinicAppRoute(): boolean {
  const segments = useSegments();
  return segments.some((segment) => isClinicAppSegment(segment));
}

/**
 * Watermelon DatabaseProvider for clinic UI.
 * Mount this inside clinic route layouts (tabs / detail stacks) — not around the
 * root auth stack — so pair/login are not remounted and schedule never renders
 * without a provider due to segment timing races.
 */
export function ClinicDatabaseBoundary({ children }: { children: ReactNode }) {
  const { customerId, database, isDatabaseReady } = useClinicSession();

  if (!isDatabaseReady || !database || !customerId) {
    return <ClinicSessionOpening />;
  }

  return (
    <DatabaseProvider database={database}>
      <ClinicSessionSubtree key={customerId}>{children}</ClinicSessionSubtree>
    </DatabaseProvider>
  );
}

/**
 * Re-provides WatermelonDB inside BottomSheetModal content.
 * Gorhom portals modal children under BottomSheetModalProvider, so they lose
 * any DatabaseProvider that only wraps the BottomSheetModal host component.
 */
export function ClinicSheetDatabaseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { customerId, database, isDatabaseReady } = useClinicSession();

  if (!isDatabaseReady || !database || !customerId) {
    return null;
  }

  return <DatabaseProvider database={database}>{children}</DatabaseProvider>;
}

function ClinicSessionSubtree({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function ClinicSessionOpening() {
  const native = useNativeColors();

  return (
    <View
      accessibilityLabel="Opening clinic"
      accessibilityViewIsModal
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: native.surface.default,
          alignItems: "center",
          justifyContent: "center",
          gap: semantic.space.gap.default,
          paddingHorizontal: semantic.space.inline.comfortable,
        },
      ]}
    >
      <ActivityIndicator color={native.brand.default} size="large" />
      <ThemedText align="center" className="font-semibold" variant="body">
        Opening clinic…
      </ThemedText>
    </View>
  );
}
