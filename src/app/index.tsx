import { type Href, useRouter } from "expo-router";
import { useEffect } from "react";

import { BrandedSplash } from "@/components/app/BrandLogo";
import { hideNativeSplash } from "@/helpers/nativeSplash";
import { useHasHydrated } from "@/stores";

export default function Index() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    // AUTH BYPASSED: stay signed in and skip login/onboarding/session validation.
    // if (!customerId) {
    //   router.replace("/(auth)/onboarding" as Href);
    //   return;
    // }
    //
    // if (!isAuthenticated) {
    //   router.replace("/(auth)/login?intro=1" as Href);
    //   return;
    // }
    //
    // if (isValidatingSession) {
    //   return;
    // }
    //
    // if (isSessionInvalid) {
    //   useAuthStore.getState().clearSession();
    //   router.replace("/(auth)/login?intro=1" as Href);
    //   return;
    // }
    //
    // if (!isSessionValid) {
    //   return;
    // }
    //
    // if (isSyncFailed) {
    //   void hideNativeSplash();
    //   return;
    // }
    //
    // if (!hasSyncedThisVisit) {
    //   return;
    // }
    //
    // if (isSyncComplete) {
    //   void hideNativeSplash();
    //   router.replace("/(tabs)/schedule" as Href);
    // }

    void hideNativeSplash();
    router.replace("/(tabs)/schedule" as Href);
  }, [hasHydrated, router]);

  return <BrandedSplash />;
}
