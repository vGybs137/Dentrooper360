import React from "react";
import { View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";

import { useThemeTokens } from "@/theme";
import { cn } from "@/utils/cn";
import type { BorderTone, SurfaceTone } from "@/tokens";

type RadiusVariant = "none" | "control" | "card" | "overlay" | "dialog" | "pill";
type Density = "compact" | "default" | "comfortable" | "none";

export type ThemedViewProps = ViewProps & {
  surface?: SurfaceTone;
  borderTone?: BorderTone | "none";
  radius?: RadiusVariant;
  inset?: Density;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

function resolveRadius(radius: RadiusVariant, theme: ReturnType<typeof useThemeTokens>) {
  if (radius === "none") {
    return 0;
  }

  return theme.semantic.radius[radius];
}

function resolveInset(inset: Density, theme: ReturnType<typeof useThemeTokens>) {
  if (inset === "none") {
    return 0;
  }

  return theme.semantic.space.inset[inset];
}

export function ThemedView({
  surface = "default",
  borderTone = "none",
  radius = "none",
  inset = "none",
  className,
  style,
  ...props
}: ThemedViewProps) {
  const theme = useThemeTokens();
  const borderWidth = borderTone === "none" ? 0 : theme.semantic.borderWidth.subtle;

  return (
    <View
      className={cn(className)}
      style={[
        {
          backgroundColor: theme.palette.surface[surface],
          borderColor:
            borderTone === "none"
              ? "transparent"
              : theme.palette.border[borderTone],
          borderWidth,
          borderRadius: resolveRadius(radius, theme),
          padding: resolveInset(inset, theme),
        },
        style,
      ]}
      {...props}
    />
  );
}
