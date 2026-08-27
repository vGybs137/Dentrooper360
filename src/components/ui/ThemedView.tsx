import { cva, type VariantProps } from "class-variance-authority";
import React from "react";
import { View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";

import { cn } from "@/utils/cn";

const themedViewVariants = cva("", {
  variants: {
    surface: {
      default: "bg-surface-default",
      sunken: "bg-surface-sunken",
      raised: "bg-surface-raised",
      overlay: "bg-surface-overlay",
      inverse: "bg-surface-inverse",
    },
    borderTone: {
      none: "border-0",
      subtle: "border-subtle border-border-subtle",
      default: "border-subtle border-border-default",
      strong: "border-subtle border-border-strong",
      focus: "border-subtle border-border-focus",
    },
    radius: {
      none: "rounded-none",
      control: "rounded-control",
      card: "rounded-card",
      overlay: "rounded-overlay",
      dialog: "rounded-dialog",
      pill: "rounded-pill",
    },
    inset: {
      none: "",
      compact: "p-inset-compact",
      default: "p-inset",
      comfortable: "p-inset-comfortable",
    },
  },
  defaultVariants: {
    surface: "default",
    borderTone: "none",
    radius: "none",
    inset: "none",
  },
});

export type ThemedViewProps = ViewProps &
  VariantProps<typeof themedViewVariants> & {
    className?: string;
    style?: StyleProp<ViewStyle>;
  };

export function ThemedView({
  surface = "default",
  borderTone = "none",
  radius = "none",
  inset = "none",
  className,
  style,
  ...props
}: ThemedViewProps) {
  return (
    <View
      className={cn(
        themedViewVariants({ surface, borderTone, radius, inset }),
        className,
      )}
      style={style}
      {...props}
    />
  );
}
