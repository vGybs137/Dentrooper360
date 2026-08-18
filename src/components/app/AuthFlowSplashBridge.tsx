import { useEffect } from "react";

import { useSplashIntro } from "@/hooks/useSplashIntro";
import { useAuthFlowStore } from "@/stores/authFlowStore";

export function AuthFlowSplashBridge() {
  const splashIntro = useSplashIntro(true);
  const syncSplashIntro = useAuthFlowStore((state) => state.syncSplashIntro);
  const setSplashIntroReady = useAuthFlowStore(
    (state) => state.setSplashIntroReady,
  );

  syncSplashIntro(splashIntro, {
    dismiss: splashIntro.dismiss,
    restore: splashIntro.restore,
  });

  useEffect(() => {
    setSplashIntroReady(true);

    return () => {
      syncSplashIntro(null, null);
      setSplashIntroReady(false);
      useAuthFlowStore.setState({ isLeaving: false });
    };
  }, [setSplashIntroReady, syncSplashIntro]);

  return null;
}
