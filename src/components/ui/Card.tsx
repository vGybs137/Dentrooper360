import React from "react";
import { type StyleProp, type ViewStyle } from "react-native";

import { ThemedView, type ThemedViewProps } from "./ThemedView";

export type CardProps = Omit<ThemedViewProps, "surface" | "radius" | "borderTone"> & {
  style?: StyleProp<ViewStyle>;
};

export function Card({ inset = "default", style, ...props }: CardProps) {
  return (
    <ThemedView
      surface="raised"
      borderTone="subtle"
      radius="card"
      inset={inset}
      style={style}
      {...props}
    />
  );
}
