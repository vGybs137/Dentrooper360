import { useEffect } from "react";

import { useSplashIntro } from "@/hooks/useSplashIntro";
import { useAuthFlowStore } from "@/stores/authFlowStore";

export function AuthFlowSplashBridge() {
  const splashIntro = useSplashIntro(true);
  const syncSplashIntro = useAuthFlowStore((state) => state.syncSplashIntro);

  syncSplashIntro(splashIntro, {
    dismiss: splashIntro.dismiss,
    restore: splashIntro.restore,
  });

  useEffect(() => {
    return () => {
      syncSplashIntro(null, null);
      useAuthFlowStore.setState({ isLeaving: false });
    };
  }, [syncSplashIntro]);

  return null;
}
