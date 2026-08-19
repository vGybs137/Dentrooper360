import { type ReactNode } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";

import { ThemedView } from "@/components/ui";
import { type useSplashIntro } from "@/hooks/useSplashIntro";

import { SplashFooter } from "./BrandLogo";

type SplashIntroLayoutProps = {
  intro: ReturnType<typeof useSplashIntro>;
  logo: ReactNode;
  children: ReactNode;
};

export function SplashIntroLayout({
  intro,
  logo,
  children,
}: SplashIntroLayoutProps) {
  return (
    <ThemedView className="flex-1 overflow-hidden" surface="sunken">
      <Animated.View
        className="absolute inset-0 items-center justify-center"
        style={intro.logoStyle}
      >
        <View
          onLayout={(event) => {
            intro.onLogoLayout(event.nativeEvent.layout.height);
          }}
        >
          {logo}
        </View>
      </Animated.View>
      <SplashFooter />
      <Animated.View
        className="absolute inset-x-0 bottom-0 z-raised"
        onLayout={(event) => {
          intro.onContentLayout(event.nativeEvent.layout.height);
        }}
        style={intro.contentStyle}
      >
        {children}
      </Animated.View>
    </ThemedView>
  );
}
