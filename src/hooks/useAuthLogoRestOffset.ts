import { useCallback } from "react";
import { type LayoutChangeEvent } from "react-native";
import {
  makeMutable,
  type SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

export const loginLogoHeight = makeMutable(0);
export const loginLogoRestY = makeMutable(0);

export function registerLoginLogoRest(height: number, y: number) {
  if (height <= 0) {
    return;
  }

  loginLogoHeight.value = height;
  loginLogoRestY.value = y;
}

export function getLoginLogoRestTranslateY(
  windowHeight: number,
  logoHeight: number,
): number | null {
  "worklet";

  if (logoHeight <= 0 || loginLogoRestY.value <= 0 || loginLogoHeight.value <= 0) {
    return null;
  }

  const centeredTop = (windowHeight - logoHeight) / 2;
  return loginLogoRestY.value - centeredTop;
}

export function getEstimatedLoginLogoRestTranslateY(
  windowHeight: number,
  logoHeight: number,
  headingBlock: number,
  fieldsBlock: number,
): number {
  "worklet";

  const logoRestTop =
    (windowHeight - fieldsBlock) / 2 - headingBlock - logoHeight;

  return logoRestTop - (windowHeight - logoHeight) / 2;
}

export function useLoginLogoRestLayout() {
  return useCallback((event: LayoutChangeEvent) => {
    registerLoginLogoRest(
      event.nativeEvent.layout.height,
      event.nativeEvent.layout.y,
    );
  }, []);
}

export function useLoginLogoIntroStyle(
  enabled: boolean,
  windowHeight: number,
  progress: SharedValue<number>,
  logoHeight: SharedValue<number>,
) {
  return useAnimatedStyle(() => {
    if (!enabled || logoHeight.value === 0) {
      return { transform: [{ translateY: 0 }] };
    }

    const centeredTop = (windowHeight - logoHeight.value) / 2;
    const offset = Math.max(centeredTop - loginLogoRestY.value, 0);

    return {
      transform: [{ translateY: (1 - progress.value) * offset }],
    };
  });
}
