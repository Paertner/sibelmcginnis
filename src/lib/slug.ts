/** Web addresses for posts and sessions. Old links that use the id keep working. */
export function slugify(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}
/** The part of the address that identifies an item. */
export const slugOf = (item: { id: string; slug?: string }) =>
  item.slug || item.id;
/** Finds an item by its slug, or by its id for older links. */
export function bySlug<T extends { id: string; slug?: string }>(
  items: T[],
  param: string,
) {
  const value = decodeURIComponent(param);
  return (
    items.find((x) => x.slug === value) ?? items.find((x) => x.id === value)
  );
}
