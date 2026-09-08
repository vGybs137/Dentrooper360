import type { DayKey } from "@/helpers/schedule/calendar";

export type DayPressHandler = (
  dayKey: DayKey,
  alreadySelected: boolean,
) => void;
