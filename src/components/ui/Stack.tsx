import React from "react";
import { View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";

import { useThemeTokens } from "@/theme";
import { cn } from "@/utils/cn";

type StackSpace = "compact" | "default" | "comfortable";
type StackDirection = "column" | "row";

export type StackProps = ViewProps & {
  space?: StackSpace;
  direction?: StackDirection;
  align?: ViewStyle["alignItems"];
  justify?: ViewStyle["justifyContent"];
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function Stack({
  space = "default",
  direction = "column",
  align,
  justify,
  className,
  style,
  ...props
}: StackProps) {
  const theme = useThemeTokens();

  return (
    <View
      className={cn(className)}
      style={[
        {
          flexDirection: direction,
          gap: theme.semantic.space.gap[space],
          alignItems: align,
          justifyContent: justify,
        },
        style,
      ]}
      {...props}
    />
  );
}
