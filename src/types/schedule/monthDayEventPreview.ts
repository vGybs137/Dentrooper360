export type MonthDayEventPreview = {
  id: string;
  title: string;
  /** Type color, or null when the appointment has no type. */
  color: string | null;
  typeName: string | null;
  /** Epoch ms */
  startTime: number;
  /** Epoch ms */
  endTime: number;
};
