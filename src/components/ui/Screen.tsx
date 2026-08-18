import React from "react";
import { ScrollView, View, type ScrollViewProps, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeTokens } from "@/theme";
import { cn } from "@/utils/cn";
import type { SurfaceTone } from "@/tokens";

type ScreenInset = "compact" | "default" | "comfortable";

export type ScreenProps = {
  children: React.ReactNode;
  surface?: SurfaceTone;
  scroll?: boolean;
  inset?: ScreenInset;
  bottomInset?: number;
  className?: string;
  contentClassName?: string;
  contentContainerStyle?: ScrollViewProps["contentContainerStyle"];
  style?: ViewStyle;
};

export function Screen({
  children,
  surface = "default",
  scroll = false,
  inset = "default",
  bottomInset = 0,
  className,
  contentClassName,
  contentContainerStyle,
  style,
}: ScreenProps) {
  const theme = useThemeTokens();
  const contentPadding = theme.semantic.space.page;
  const backgroundColor = theme.palette.surface[surface];
  const bottomPadding = contentPadding + bottomInset;

  if (scroll) {
    return (
      <SafeAreaView
        className={cn("flex-1", className)}
        style={[{ flex: 1, backgroundColor }, style]}
      >
        <ScrollView
          className={cn("flex-1", contentClassName)}
          contentContainerStyle={[
            {
              flexGrow: 1,
              paddingTop: contentPadding,
              paddingBottom: bottomPadding,
              paddingHorizontal: theme.semantic.space.inline[inset],
            },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={cn("flex-1", className)}
      style={[{ flex: 1, backgroundColor }, style]}
    >
      <View
        className={cn("flex-1", contentClassName)}
        style={{
          flex: 1,
          paddingTop: contentPadding,
          paddingBottom: bottomPadding,
          paddingHorizontal: theme.semantic.space.inline[inset],
        }}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}
