/** Which emails a member chooses to receive. Everything is on until they change it. */
export const emailCategories = [
  {
    key: "post",
    field: "posts",
    label: "New blog posts",
    hint: "An email when a new article is published.",
  },
  {
    key: "podcast",
    field: "podcasts",
    label: "New podcast episodes",
    hint: "An email when a new episode is ready to hear.",
  },
  {
    key: "event",
    field: "events",
    label: "Events",
    hint: "Invitations and reminders for in-person events.",
  },
  {
    key: "announcement",
    field: "announcements",
    label: "Announcements",
    hint: "Personal notes and news from Sibel.",
  },
] as const;
export type EmailCategory = (typeof emailCategories)[number]["key"];
export type EmailField = (typeof emailCategories)[number]["field"];
export type EmailPreferences = Partial<Record<EmailField, boolean>> & {
  unsubscribedAll?: boolean;
};
export const categoryOptions = [
  { value: "announcement", label: "Announcement" },
  { value: "post", label: "New post" },
  { value: "podcast", label: "New podcast episode" },
  { value: "event", label: "Event" },
];
export const isEmailCategory = (value: string): value is EmailCategory =>
  emailCategories.some((category) => category.key === value);

/** The member's choices with the defaults filled in. */
export function resolvedPreferences(preferences?: EmailPreferences) {
  return {
    unsubscribedAll: preferences?.unsubscribedAll === true,
    posts: preferences?.posts !== false,
    podcasts: preferences?.podcasts !== false,
    events: preferences?.events !== false,
    announcements: preferences?.announcements !== false,
  };
}
/** Whether a member wants emails of this kind. */
export function wantsEmail(
  preferences: EmailPreferences | undefined,
  category: EmailCategory,
) {
  const resolved = resolvedPreferences(preferences);
  const field = emailCategories.find((entry) => entry.key === category)!.field;
  return !resolved.unsubscribedAll && resolved[field];
}
/** Categories a member has turned off ("all" when they unsubscribed from everything). */
export function optedOut(preferences?: EmailPreferences): string[] {
  if (preferences?.unsubscribedAll) return ["all"];
  return emailCategories
    .filter((category) => !wantsEmail(preferences, category.key))
    .map((category) => category.key);
}
