import type { SharedValue } from "react-native-reanimated";

/** 0 = month chips, 1 = week dots (UI-thread sheet open progress). */
export type SheetOpenProgressValue = SharedValue<number> | null;
