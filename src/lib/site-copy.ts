import "server-only";
import catalog from "./site-copy-catalog.json";
import { getStore } from "./store";
import { withWeekday } from "./weekday";
const defaults = new Map(catalog.map((entry) => [entry.id, entry.text]));
export function siteText(id: string) {
  const store = getStore();
  // Texts the owner wrote are shown as written; only built-in wording follows the weekday.
  const own = store.siteCopy?.[id];
  if (own !== undefined) return own;
  return withWeekday(defaults.get(id) ?? "", store.settings.meetingWeekday);
}
