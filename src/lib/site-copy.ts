import "server-only";
import catalog from "./site-copy-catalog.json";
import { getStore } from "./store";
const defaults = new Map(catalog.map((entry) => [entry.id, entry.text]));
export function siteText(id: string) {
  return getStore().siteCopy?.[id] ?? defaults.get(id) ?? "";
}
