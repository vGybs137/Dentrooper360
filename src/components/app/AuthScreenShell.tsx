import { type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  type ViewProps,
} from "react-native";

import { SplashFooter } from "@/components/app/BrandLogo";
import { ThemedView } from "@/components/ui";

type AuthScreenShellProps = {
  children: ReactNode;
  showFooter?: boolean;
  transparent?: boolean;
  pointerEvents?: ViewProps["pointerEvents"];
};

export function AuthScreenShell({
  children,
  showFooter = true,
  transparent = false,
  pointerEvents,
}: AuthScreenShellProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
      pointerEvents={pointerEvents}
    >
      <ThemedView
        className="flex-1 overflow-hidden"
        pointerEvents={pointerEvents}
        style={transparent ? { backgroundColor: "transparent" } : undefined}
        surface="sunken"
      >
        {showFooter ? <SplashFooter /> : null}
        {children}
      </ThemedView>
    </KeyboardAvoidingView>
  );
}
