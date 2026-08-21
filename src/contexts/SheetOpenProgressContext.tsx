import { createContext, useContext } from "react";

import type { SheetOpenProgressValue } from "@/types/schedule";

/** Updated on the UI thread with sheet open progress (0 chips → 1 dots). */
export const SheetOpenProgressContext =
  createContext<SheetOpenProgressValue>(null);

export function useSheetOpenProgress(): SheetOpenProgressValue {
  return useContext(SheetOpenProgressContext);
}
