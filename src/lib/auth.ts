import "server-only";
import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { demoEnabled, getStore } from "./store";
import type { User } from "./access";
import { memberRole } from "./membership";

const globalAuth = globalThis as typeof globalThis & {
  morningCoffeeSecret?: string;
};
const secret = () =>
  (globalAuth.morningCoffeeSecret ??= randomBytes(32).toString("hex"));
const sign = (value: string) =>
  createHmac("sha256", secret()).update(value).digest("hex");
const COOKIE = "mcc-development-session";

export async function getUser(): Promise<User | null> {
  if (!demoEnabled()) return null;
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [id, expires, signature] = raw.split(".");
  if (!id || !expires || !signature || Number(expires) < Date.now())
    return null;
  const expected = sign(`${id}.${expires}`);
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  )
    return null;
  if (id === "admin")
    return {
      id,
      name: "Sibel McGinnis",
      email: "sibel@example.com",
      role: "admin",
    };
  const member = getStore().members.find(
    (m) => m.id === id && m.status === "active",
  );
  if (!member || !["free", "premium"].includes(member.tier)) return null;
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    role: memberRole(member),
  };
}

export async function setDemoSession(id: string) {
  if (!demoEnabled()) throw new Error("Development sign-in is disabled.");
  const value = `${id}.${Date.now() + 8 * 3600000}`;
  (await cookies()).set(COOKIE, `${value}.${sign(value)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 3600,
  });
}
export async function clearSession() {
  (await cookies()).delete(COOKIE);
}
export async function requireMember() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
export async function requireAdmin() {
  const user = await requireMember();
  if (user.role !== "admin") redirect("/account");
  return user;
}
