import { create } from "zustand";

import type { useSplashIntro } from "@/hooks/useSplashIntro";

export type SplashIntro = ReturnType<typeof useSplashIntro>;

type SplashIntroHandlers = {
  dismiss: () => void;
  restore: () => void;
};

type AuthFlowStoreState = {
  isLeaving: boolean;
  splashIntroReady: boolean;
  syncSplashIntro: (
    intro: SplashIntro | null,
    handlers: SplashIntroHandlers | null,
  ) => void;
  setSplashIntroReady: (ready: boolean) => void;
  beginOnboardingExit: () => void;
  restoreOnboarding: () => void;
};

let splashIntroRef: SplashIntro | null = null;
let splashHandlersRef: SplashIntroHandlers | null = null;

export function getAuthFlowSplashIntro(): SplashIntro {
  if (!splashIntroRef) {
    throw new Error(
      "Auth flow splash intro is not ready. Ensure AuthFlowSplashBridge is mounted.",
    );
  }

  return splashIntroRef;
}

export const useAuthFlowStore = create<AuthFlowStoreState>((set) => ({
  isLeaving: false,
  splashIntroReady: false,
  syncSplashIntro: (intro, handlers) => {
    splashIntroRef = intro;
    splashHandlersRef = handlers;
  },
  setSplashIntroReady: (ready) => set({ splashIntroReady: ready }),
  beginOnboardingExit: () => {
    set({ isLeaving: true });
    splashHandlersRef?.dismiss();
  },
  restoreOnboarding: () => {
    set({ isLeaving: false });
    splashHandlersRef?.restore();
  },
}));

export function useAuthFlowSplashIntro(): SplashIntro {
  const splashIntroReady = useAuthFlowStore((state) => state.splashIntroReady);

  if (!splashIntroReady) {
    throw new Error(
      "Auth flow splash intro is not ready. Ensure AuthFlowSplashBridge is mounted.",
    );
  }

  return getAuthFlowSplashIntro();
}

export function useAuthFlowIsLeaving() {
  return useAuthFlowStore((state) => state.isLeaving);
}

export function useBeginOnboardingExit() {
  return useAuthFlowStore((state) => state.beginOnboardingExit);
}

export function useRestoreOnboarding() {
  return useAuthFlowStore((state) => state.restoreOnboarding);
}
