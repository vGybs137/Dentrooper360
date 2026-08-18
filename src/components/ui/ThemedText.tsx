import React from "react";
import { Text, type StyleProp, type TextProps, type TextStyle } from "react-native";

import { useThemeTokens } from "@/theme";
import { cn } from "@/utils/cn";

type TextVariant = "label" | "body" | "title" | "display";
type TextTone =
  | "default"
  | "muted"
  | "inverse"
  | "brand"
  | "accent"
  | "success"
  | "alert";
type TextAlign = "auto" | "left" | "center" | "right" | "justify";

export type ThemedTextProps = TextProps & {
  variant?: TextVariant;
  tone?: TextTone;
  align?: TextAlign;
  className?: string;
  style?: StyleProp<TextStyle>;
};

function getTextColor(tone: TextTone, theme: ReturnType<typeof useThemeTokens>) {
  switch (tone) {
    case "muted":
      return theme.palette.foreground.muted;
    case "inverse":
      return theme.palette.foreground.inverse;
    case "brand":
      return theme.palette.brand.default;
    case "accent":
      return theme.palette.accent.default;
    case "success":
      return theme.palette.success.DEFAULT;
    case "alert":
      return theme.palette.alert.DEFAULT;
    case "default":
    default:
      return theme.palette.foreground.default;
  }
}

export function ThemedText({
  variant = "body",
  tone = "default",
  align = "auto",
  className,
  style,
  ...props
}: ThemedTextProps) {
  const theme = useThemeTokens();
  const typeToken = theme.semantic.type[variant];
  const textStyle: TextStyle = {
    color: getTextColor(tone, theme),
    fontSize: typeToken.fontSize,
    lineHeight: typeToken.lineHeight,
    fontWeight: typeToken.fontWeight as TextStyle["fontWeight"],
    textAlign: align,
  };

  return (
    <Text
      className={cn("shrink text-body", className)}
      style={[textStyle, style]}
      {...props}
    />
  );
}
