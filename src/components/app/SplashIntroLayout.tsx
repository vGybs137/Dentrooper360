import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/ui";
import { type useSplashIntro } from "@/hooks/useSplashIntro";
import { useThemeTokens } from "@/theme";

import { SplashFooter } from "./BrandLogo";

type SplashIntroLayoutProps = {
  enabled: boolean;
  intro: ReturnType<typeof useSplashIntro>;
  logo: ReactNode;
  children: ReactNode;
};

export function SplashIntroLayout({
  enabled,
  intro,
  logo,
  children,
}: SplashIntroLayoutProps) {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();

  if (!enabled) {
    return (
      <ThemedView surface="sunken" style={styles.root}>
        <View
          style={{
            alignItems: "center",
            paddingTop: insets.top + theme.semantic.space.page,
            paddingBottom: theme.semantic.space.page,
          }}
        >
          {logo}
        </View>
        <View style={styles.restingContent}>{children}</View>
        <SplashFooter />
      </ThemedView>
    );
  }

  return (
    <ThemedView surface="sunken" style={styles.root}>
      <Animated.View style={[styles.logoStage, intro.logoStyle]}>
        {logo}
      </Animated.View>
      <Animated.View
        onLayout={(event) => {
          intro.onContentLayout(event.nativeEvent.layout.height);
        }}
        style={[styles.contentStage, intro.contentStyle]}
      >
        {children}
      </Animated.View>
      <SplashFooter />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
  },
  restingContent: {
    flex: 1,
  },
  logoStage: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  contentStage: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
  },
});
