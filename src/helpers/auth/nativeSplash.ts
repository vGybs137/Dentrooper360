import { SplashScreen } from "expo-router";
import { setOptions } from "expo-splash-screen";

let hidePromise: Promise<void> | null = null;

export function keepNativeSplashVisible() {
  SplashScreen.preventAutoHideAsync();
  setOptions({ duration: 400, fade: true });
}

export function hideNativeSplash() {
  if (!hidePromise) {
    hidePromise = SplashScreen.hideAsync();
  }

  return hidePromise;
}
