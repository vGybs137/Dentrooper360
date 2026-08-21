import type { DayKey } from "@/utils/calendar";

export type DayPressHandler = (
  dayKey: DayKey,
  alreadySelected: boolean,
) => void;
