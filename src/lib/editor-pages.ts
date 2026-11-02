/** Public pages the visual editor can open. `groups` are the catalog sections whose text appears on the page. */
export type EditorPage = {
  key: string;
  path: string;
  label: string;
  /** The page title before any SEO override, without the site name. */
  title: string;
  groups: string[];
};
/** Text shown on every page (header, footer, menu). */
export const sharedGroups = ["Header & footer", "Navigation"];
export const defaultDescription =
  "A warm, supportive space for women to connect, reflect and grow. Weekly live circles and personal coaching with Sibel McGinnis.";
export const editorPages: EditorPage[] = [
  {
    key: "home",
    path: "/",
    label: "Home",
    title: "",
    groups: ["Homepage", "Blog labels", "Audio player"],
  },
  {
    key: "about",
    path: "/about",
    label: "Meet Sibel",
    title: "Meet Sibel",
    groups: ["Meet Sibel"],
  },
  {
    key: "morning-coffee",
    path: "/morning-coffee",
    label: "Morning Coffee Community",
    title: "Membership",
    groups: ["Community & membership"],
  },
  {
    key: "solutions",
    path: "/solutions",
    label: "Solutions",
    title: "Solutions",
    groups: ["Solutions"],
  },
  {
    key: "events",
    path: "/events",
    label: "Events",
    title: "Events",
    groups: ["Events"],
  },
  {
    key: "podcast",
    path: "/podcast",
    label: "Podcast",
    title: "Podcast",
    groups: ["Podcast", "Audio player"],
  },
  {
    key: "blog",
    path: "/blog",
    label: "Blog",
    title: "Blog",
    groups: ["Blog", "Blog labels"],
  },
  {
    key: "contact",
    path: "/contact",
    label: "Contact",
    title: "Contact",
    groups: ["Contact"],
  },
  {
    key: "join",
    path: "/join",
    label: "Join",
    title: "Join the community",
    groups: ["Join"],
  },
];
export const seoId = (key: string, field: "title" | "description") =>
  `seo.${key}.${field}`;
export const isSeoId = (id: string) =>
  editorPages.some(
    (page) =>
      id === seoId(page.key, "title") || id === seoId(page.key, "description"),
  );
