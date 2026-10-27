export const iso = (date = new Date()) => date.toISOString().slice(0, 10);
export const today = () => iso();
export function nextSaturday(weeks = 0) {
  const d = new Date(today() + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + ((6 - d.getUTCDay() + 7) % 7) + weeks * 7);
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
