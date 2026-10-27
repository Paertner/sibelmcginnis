export type Role = "visitor" | "free" | "premium" | "admin";
export type User = {
  id: string;
  name: string;
  email: string;
  role: Exclude<Role, "visitor">;
};
const ranks: Record<Role, number> = {
  visitor: 0,
  free: 1,
  premium: 2,
  admin: 3,
};
export function canView(access: string, role: Role = "visitor") {
  const levels: Record<string, number> = { public: 0, free: 1, premium: 2 };
  const required = levels[access];
  return required !== undefined && ranks[role] >= required;
}
export const isPremium = (role: Role = "visitor") =>
  role === "premium" || role === "admin";
