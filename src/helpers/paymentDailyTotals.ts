import dayjs, { type Dayjs } from "dayjs";

export type PaymentDailyTotal = {
  /** Local calendar day at start of day. */
  date: Date;
  total: number;
};

export type PaymentAmountDate = {
  amount: number;
  date: Date;
};

/**
 * Zero-filled daily payment totals for every day in the calendar month of
 * `referenceDate`, oldest first.
 */
export function buildPaymentMonthDailyTotals(
  payments: readonly PaymentAmountDate[],
  referenceDate: Dayjs = dayjs(),
): PaymentDailyTotal[] {
  const start = referenceDate.startOf("month");
  const end = referenceDate.endOf("month").startOf("day");
  const dayCount = end.diff(start, "day") + 1;

  const totalsByKey = new Map<string, number>();

  for (const payment of payments) {
    if (!payment.date || Number.isNaN(payment.date.getTime())) {
      continue;
    }

    const day = dayjs(payment.date).startOf("day");
    if (day.isBefore(start) || day.isAfter(end)) {
      continue;
    }

    const key = day.format("YYYY-MM-DD");
    totalsByKey.set(key, (totalsByKey.get(key) ?? 0) + (payment.amount ?? 0));
  }

  const result: PaymentDailyTotal[] = [];
  for (let offset = 0; offset < dayCount; offset++) {
    const day = start.add(offset, "day");
    const key = day.format("YYYY-MM-DD");
    result.push({
      date: day.toDate(),
      total: totalsByKey.get(key) ?? 0,
    });
  }

  return result;
}
