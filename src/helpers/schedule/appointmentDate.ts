import dayjs from "dayjs";

export function parseCalendarDateString(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function combineDateAndTime(date: Date, time: Date): Date {
  return dayjs(date)
    .startOf("day")
    .hour(dayjs(time).hour())
    .minute(dayjs(time).minute())
    .second(0)
    .millisecond(0)
    .toDate();
}

export function toCalendarDateString(date: Date): string {
  return dayjs(date).format("YYYY-MM-DD");
}
