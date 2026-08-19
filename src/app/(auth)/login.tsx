import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { useWindowDimensions } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { AuthScreenShell } from "@/components/app/AuthScreenShell";
import { BrandLogo } from "@/components/app/BrandLogo";
import { LoginForm } from "@/components/app/LoginForm";
import { hideNativeSplash } from "@/helpers/nativeSplash";
import { isIntroFromSplash } from "@/helpers/routeParams";
import { useSplashIntro } from "@/hooks/useSplashIntro";

export default function LoginScreen() {
  const { intro } = useLocalSearchParams<{
    intro?: string | string[];
  }>();
  const animateFromSplash = isIntroFromSplash(intro);
  const { height: windowHeight } = useWindowDimensions();
  const splashIntro = useSplashIntro(animateFromSplash);
  const logoHeight = useSharedValue(0);
  const logoRestY = useSharedValue(0);

  useEffect(() => {
    void hideNativeSplash();

    if (animateFromSplash) {
      splashIntro.start();
    }
    // start() is guarded by a shared value, so it is safe across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run for the splash intro
  }, [animateFromSplash]);

  const logoStyle = useAnimatedStyle(() => {
    if (!animateFromSplash || logoHeight.value === 0) {
      return { transform: [{ translateY: 0 }] };
    }

    const centeredTop = (windowHeight - logoHeight.value) / 2;
    const offset = Math.max(centeredTop - logoRestY.value, 0);

    return {
      transform: [{ translateY: (1 - splashIntro.progress.value) * offset }],
    };
  });

  const incomingStyle = useAnimatedStyle(() => {
    if (!animateFromSplash) {
      return { opacity: 1, transform: [{ translateY: 0 }] };
    }

    return {
      opacity: interpolate(
        splashIntro.progress.value,
        [0, 0.2],
        [0, 1],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateY: (1 - splashIntro.progress.value) * windowHeight,
        },
      ],
    };
  });

  return (
    <AuthScreenShell>
      <LoginForm
        contentStyle={incomingStyle}
        logo={
          <Animated.View
            className="items-center"
            onLayout={(event) => {
              logoHeight.value = event.nativeEvent.layout.height;
              logoRestY.value = event.nativeEvent.layout.y;
            }}
            style={logoStyle}
          >
            <BrandLogo
              showWordmark={animateFromSplash}
              wordmarkStyle={splashIntro.wordmarkStyle}
            />
          </Animated.View>
        }
        onFieldsLayout={splashIntro.onContentLayout}
      />
    </AuthScreenShell>
  );
}
