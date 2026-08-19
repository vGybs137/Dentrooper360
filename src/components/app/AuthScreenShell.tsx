import { type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  type ViewProps,
} from "react-native";

import { SplashFooter } from "@/components/app/BrandLogo";
import { ThemedView } from "@/components/ui";

export type AuthFooterVisibility = "always" | "hidden" | "underSheet";

type AuthScreenShellProps = {
  children: ReactNode;
  footerVisibility?: AuthFooterVisibility;
  transparent?: boolean;
  pointerEvents?: ViewProps["pointerEvents"];
};

export function AuthScreenShell({
  children,
  footerVisibility = "always",
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
        {footerVisibility !== "hidden" ? <SplashFooter /> : null}
        {children}
      </ThemedView>
    </KeyboardAvoidingView>
  );
}
