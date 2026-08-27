import { cva, type VariantProps } from "class-variance-authority";
import React from "react";
import { Text, type StyleProp, type TextProps, type TextStyle } from "react-native";

import { cn } from "@/utils/cn";

const themedTextVariants = cva("shrink", {
  variants: {
    variant: {
      label: "text-label",
      body: "text-body",
      title: "text-title",
      display: "text-display",
    },
    tone: {
      default: "text-foreground-default",
      muted: "text-foreground-muted",
      inverse: "text-foreground-inverse",
      brand: "text-brand-default",
      accent: "text-accent-default",
      success: "text-success-default",
      alert: "text-alert-default",
    },
    align: {
      auto: "",
      left: "text-left",
      center: "text-center",
      right: "text-right",
      justify: "text-justify",
    },
  },
  defaultVariants: {
    variant: "body",
    tone: "default",
    align: "auto",
  },
});

export type ThemedTextProps = TextProps &
  VariantProps<typeof themedTextVariants> & {
    className?: string;
    style?: StyleProp<TextStyle>;
  };

export function ThemedText({
  variant = "body",
  tone = "default",
  align = "auto",
  className,
  style,
  ...props
}: ThemedTextProps) {
  return (
    <Text
      className={cn(themedTextVariants({ variant, tone, align }), className)}
      style={style}
      {...props}
    />
  );
}
