/** The weekday of the weekly session. Chosen in Settings; Saturday until then. */
export const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
export const defaultWeekday = 6;
export const weekdayIndex = (value: unknown) =>
  Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 6
    ? Number(value)
    : defaultWeekday;
/** Wording written for Saturday follows the chosen weekday, e.g. "Saturdays" becomes "Fridays". */
export function withWeekday(text: string, weekday: number) {
  const name = weekdays[weekdayIndex(weekday)];
  return name === "Saturday" ? text : text.replace(/Saturday/g, name);
}
