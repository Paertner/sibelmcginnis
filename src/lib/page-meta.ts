import "server-only";
import type { Metadata } from "next";
import { getStore } from "./store";
import { seoId } from "./editor-pages";

/** Page metadata: the title and description saved in the visual editor, else the page's own defaults. */
export function pageMetadata(
  key: string,
  defaults: { title?: string; description?: string } = {},
): Metadata {
  const copy = getStore().siteCopy ?? {};
  const title = copy[seoId(key, "title")];
  const description = copy[seoId(key, "description")] ?? defaults.description;
  return {
    ...(title
      ? { title: { absolute: title } }
      : defaults.title
        ? { title: defaults.title }
        : {}),
    ...(description ? { description } : {}),
  };
}
