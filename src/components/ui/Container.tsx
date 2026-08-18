import React from "react";
import { View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";

import { useThemeTokens } from "@/theme";
import { cn } from "@/utils/cn";

type Density = "compact" | "default" | "comfortable";

export type ContainerProps = ViewProps & {
  inset?: Density;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function Container({
  inset = "default",
  className,
  style,
  ...props
}: ContainerProps) {
  const theme = useThemeTokens();

  return (
    <View
      className={cn("w-full self-center", className)}
      style={[
        {
          width: "100%",
          alignSelf: "center",
          paddingHorizontal: theme.semantic.space.inline[inset],
        },
        style,
      ]}
      {...props}
    />
  );
}
