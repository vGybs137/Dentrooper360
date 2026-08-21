import React from "react";
import { ScrollView, View, type ScrollViewProps, type ViewStyle } from "react-native";
import {
  SafeAreaView,
  type Edge,
} from "react-native-safe-area-context";

import { useThemeTokens } from "@/theme";
import { cn } from "@/utils/cn";
import type { SurfaceTone } from "@/tokens";

type ScreenInset = "compact" | "default" | "comfortable";

export type ScreenProps = {
  children: React.ReactNode;
  surface?: SurfaceTone;
  scroll?: boolean;
  inset?: ScreenInset;
  /** Extra space below content, added on top of page padding when padBottom is true. */
  bottomInset?: number;
  /** When false, skip page bottom padding (e.g. full-bleed above native tabs). */
  padBottom?: boolean;
  edges?: Edge[];
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
  padBottom = true,
  edges,
  className,
  contentClassName,
  contentContainerStyle,
  style,
}: ScreenProps) {
  const theme = useThemeTokens();
  const contentPadding = theme.semantic.space.page;
  const backgroundColor = theme.palette.surface[surface];
  const bottomPadding = (padBottom ? contentPadding : 0) + bottomInset;

  if (scroll) {
    return (
      <SafeAreaView
        className={cn("flex-1", className)}
        edges={edges}
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
      edges={edges}
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
