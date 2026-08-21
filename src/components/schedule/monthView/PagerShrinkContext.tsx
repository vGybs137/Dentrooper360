import { createContext, useContext, type ReactNode } from "react";
import type { SharedValue } from "react-native-reanimated";

/** Host scaleY when sheet is fully open (45%). Keep in sync with PagerTransformHost. */
export const SHEET_OPEN_HOST_SCALE_Y = 0.55;

/**
 * Visual size of day content when sheet is open.
 * Between host scale and 1: counters squash, shrinks a bit to fit the smaller cell.
 */
export const SHEET_OPEN_CONTENT_SCALE = 0.78;

const PagerShrinkContext = createContext<SharedValue<number> | null>(null);

export function PagerShrinkProvider({
  animatedIndex,
  children,
}: {
  animatedIndex: SharedValue<number>;
  children: ReactNode;
}) {
  return (
    <PagerShrinkContext.Provider value={animatedIndex}>
      {children}
    </PagerShrinkContext.Provider>
  );
}

export function usePagerShrinkIndex(): SharedValue<number> | null {
  return useContext(PagerShrinkContext);
}
