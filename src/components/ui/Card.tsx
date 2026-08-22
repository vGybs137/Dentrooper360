import React from "react";
import { type StyleProp, type ViewStyle } from "react-native";

import { ThemedView, type ThemedViewProps } from "./ThemedView";

export type CardProps = Omit<ThemedViewProps, "surface" | "radius"> & {
  style?: StyleProp<ViewStyle>;
};

export function Card({
  inset = "default",
  borderTone = "subtle",
  style,
  ...props
}: CardProps) {
  return (
    <ThemedView
      surface="raised"
      borderTone={borderTone}
      radius="card"
      inset={inset}
      style={style}
      {...props}
    />
  );
}
