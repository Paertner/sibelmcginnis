export const iso = (date = new Date()) => date.toISOString().slice(0, 10);
export const today = () => iso();
/** The next date that falls on a weekday (0 = Sunday ... 6 = Saturday), today included. */
export function nextWeekday(weekday = 6, weeks = 0) {
  const d = new Date(today() + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + ((weekday - d.getUTCDay() + 7) % 7) + weeks * 7);
  return iso(d);
}
export function fmtDate(
  date: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
  },
) {
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
    ...options,
    timeZone: "UTC",
  });
}
export function addDays(date: string, count: number) {
  return iso(
    new Date(new Date(date + "T12:00:00Z").getTime() + count * 86400000),
  );
}
/** Whole days from today to a date (0 = today, negative = past). */
export function daysUntil(date: string) {
  return Math.round(
    (Date.parse(date + "T12:00:00Z") - Date.parse(today() + "T12:00:00Z")) /
      86400000,
  );
}
/** "Today", "Tomorrow", "In 5 days"; empty for dates in the past. */
export function daysLeftLabel(date: string) {
  const days = daysUntil(date);
  return days < 0
    ? ""
    : days === 0
      ? "Today"
      : days === 1
        ? "Tomorrow"
        : `In ${days} days`;
}
/** "13:00" as "1:00 PM". Times already written with AM or PM are returned as they are. */
export function clock(time: string) {
  if (/[ap]m/i.test(time)) return time;
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
