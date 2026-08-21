import { createContext, useContext } from "react";
import type { SharedValue } from "react-native-reanimated";

/** 0 = month chips, 1 = week dots. Updated on the UI thread with sheet open progress. */
export const SheetOpenProgressContext =
  createContext<SharedValue<number> | null>(null);

export function useSheetOpenProgress(): SharedValue<number> | null {
  return useContext(SheetOpenProgressContext);
}
