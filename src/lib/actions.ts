"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, getUser, setDemoSession } from "./auth";
import { demoEnabled, demoMeeting, getDemoState, getStore } from "./store";
import { addDays, nextSaturday, today } from "./dates";
import { isPremium } from "./access";
import type { ActionResult } from "@/components/action-form";
import { publishAnnouncement } from "./announcements";
import copyCatalog from "./site-copy-catalog.json";
import { updateSiteImage } from "./site-images";

const text = (f: FormData, key: string, max = 20000) =>
  String(f.get(key) ?? "")
    .trim()
    .slice(0, max);
const required = (f: FormData, key: string, max = 20000) => {
  const v = text(f, key, max);
  if (!v) throw new Error(`Please fill in ${key}.`);
  return v;
};
const choice = (f: FormData, key: string, values: string[]) => {
  const v = text(f, key);
  if (!values.includes(v)) throw new Error(`Choose a valid ${key}.`);
  return v;
};
const number = (f: FormData, key: string, min: number, max: number) => {
  const v = Number(required(f, key));
  if (!Number.isInteger(v) || v < min || v > max)
    throw new Error(`${key} must be between ${min} and ${max}.`);
  return v;
};
const validDate = (date: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  !Number.isNaN(Date.parse(date)) &&
  new Date(date + "T12:00:00Z").toISOString().slice(0, 10) === date;
const email = (f: FormData) => {
  const value = required(f, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    throw new Error("Enter a valid email address.");
  return value;
};
const uid = () => randomUUID();
const refresh = () => revalidatePath("/", "layout");
const errorResult = (error: unknown): ActionResult => ({
  message:
    error instanceof Error
      ? error.message
      : "Could not save. Please try again.",
});
const success = (message: string): ActionResult => {
  refresh();
  return { ok: true, message };
};
function checkDemo() {
  if (!demoEnabled())
    throw new Error(
      "This service is not connected yet. Development review is available locally.",
    );
}

export async function demoLogin(form: FormData) {
  checkDemo();
  const id = choice(form, "account", ["m0", "m1", "admin"]);
  await setDemoSession(id);
  redirect(id === "admin" ? "/admin" : "/account");
}
export async function signOut() {
  await clearSession();
  redirect("/");
}
export async function join(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  let id: string;
  try {
    checkDemo();
    const tier = choice(form, "plan", ["free", "premium"]);
    const name = required(form, "name", 120),
      address = email(form);
    if (getStore().members.some((m) => m.email.toLowerCase() === address))
      throw new Error(
        "That email already exists in this review. Use a different address or a sample account.",
      );
    id = uid();
    getStore().members.push({
      id,
      name,
      email: address,
      tier,
      status: "active",
      joined: today(),
      note: "Development review account",
      premiumUntil:
        tier === "premium"
          ? new Date(Date.now() + 30 * 86400000).toISOString()
          : "",
    });
    await setDemoSession(id);
  } catch (error) {
    return errorResult(error);
  }
  redirect("/account");
}
export async function contact(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    required(form, "name", 120);
    email(form);
    required(form, "message");
    checkDemo();
    return {
      ok: true,
      message:
        "Form validated for review. No message was sent; email delivery will be connected with Resend.",
    };
  } catch (error) {
    return errorResult(error);
  }
}
export async function changeTier(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    checkDemo();
    const user = await getUser();
    if (!user || user.role === "admin")
      throw new Error("Sign in as a member first.");
    const tier = choice(form, "tier", ["free", "premium"]);
    const member = getStore().members.find((m) => m.id === user.id);
    if (!member) throw new Error("Member not found.");
    member.tier = tier;
    member.premiumUntil =
      tier === "premium"
        ? new Date(Date.now() + 30 * 86400000).toISOString()
        : "";
    return success("Review membership updated. No payment was taken.");
  } catch (error) {
    return errorResult(error);
  }
}

export async function bookConsultation(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    checkDemo();
    const user = await getUser();
    if (!user || !isPremium(user.role) || user.role === "admin")
      throw new Error("Premium membership is required.");
    const data = getStore(),
      date = required(form, "date"),
      time = required(form, "time");
    const weekday = new Date(date + "T12:00:00Z").getUTCDay();
    const availability = data.availability as Record<string, string[]>;
    if (
      !validDate(date) ||
      date <= today() ||
      date > addDays(today(), 21) ||
      !availability[weekday]?.includes(time)
    )
      throw new Error("Choose an available time within the next 21 days.");
    const active = data.bookings.filter((b) => b.status !== "cancelled");
    const used = active.filter(
      (b) => b.memberId === user.id && b.date.slice(0, 7) === date.slice(0, 7),
    ).length;
    if (used >= data.settings.consultsPerMonth)
      throw new Error(
        "Your consultation allowance for that month has been used.",
      );
    const minutes = (t: string) =>
      Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
    if (
      active.some(
        (b) =>
          b.date === date &&
          Math.abs(minutes(b.time) - minutes(time)) <
            data.settings.consultMinutes,
      )
    )
      throw new Error("That time has just been booked. Please choose another.");
    const id = uid(),
      confirmed = data.settings.autoConfirm;
    data.bookings.push({
      id,
      memberId: user.id,
      date,
      time,
      topic: text(form, "topic", 1000) || "General conversation",
      status: confirmed ? "confirmed" : "pending",
      zoom: confirmed ? demoMeeting(id) : "",
    });
    return success(
      confirmed
        ? "Consultation confirmed for review. The meeting link is a placeholder."
        : "Request saved, awaiting admin confirmation.",
    );
  } catch (error) {
    return errorResult(error);
  }
}
export async function cancelBooking(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    checkDemo();
    const user = await getUser();
    const booking = getStore().bookings.find((b) => b.id === text(form, "id"));
    if (
      !user ||
      !booking ||
      (booking.memberId !== user.id && user.role !== "admin")
    )
      throw new Error("You cannot change this booking.");
    booking.status = "cancelled";
    return success("Consultation cancelled.");
  } catch (error) {
    return errorResult(error);
  }
}

export async function adminMutation(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    checkDemo();
    const user = await getUser();
    if (user?.role !== "admin")
      throw new Error("Administrator access is required.");
    const data = getStore(),
      entity = text(form, "entity"),
      id = text(form, "id"),
      op = text(form, "op");
    if (op === "delete") {
      switch (entity) {
        case "members":
          data.members = data.members.filter((x) => x.id !== id);
          data.bookings = data.bookings.filter((x) => x.memberId !== id);
          break;
        case "posts":
          data.posts = data.posts.filter((x) => x.id !== id);
          break;
        case "sessions":
          data.sessions = data.sessions.filter((x) => x.id !== id);
          break;
        case "podcasts":
          data.podcasts = data.podcasts.filter((x) => x.id !== id);
          getDemoState().audio.delete(id);
          break;
        default:
          throw new Error("Unknown item.");
      }
      return success("Item deleted.");
    }
    if (entity === "members") {
      const address = email(form);
      if (
        data.members.some(
          (m) => m.id !== id && m.email.toLowerCase() === address,
        )
      )
        throw new Error("A member with that email already exists.");
      const value = {
        name: required(form, "name", 120),
        email: address,
        tier: choice(form, "tier", ["free", "premium"]),
        status: choice(form, "status", ["active", "paused", "cancelled"]),
        note: text(form, "note"),
        premiumUntil: text(form, "premiumUntil"),
      };
      if (
        value.premiumUntil &&
        (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value.premiumUntil) ||
          Number.isNaN(Date.parse(value.premiumUntil)))
      )
        throw new Error("Enter a valid membership expiry.");
      if (value.premiumUntil)
        value.premiumUntil = new Date(
          value.premiumUntil.endsWith("Z")
            ? value.premiumUntil
            : value.premiumUntil + "Z",
        ).toISOString();
      const item = data.members.find((x) => x.id === id);
      if (item) Object.assign(item, value);
      else data.members.push({ id: uid(), joined: today(), ...value });
    } else if (entity === "posts") {
      const value = {
        title: required(form, "title", 250),
        category: required(form, "category", 100),
        excerpt: required(form, "excerpt", 500),
        body: required(form, "body"),
        access: choice(form, "access", ["public", "free", "premium"]),
        status: choice(form, "status", ["draft", "published"]),
        cover: number(form, "cover", 0, 2),
      };
      const item = data.posts.find((x) => x.id === id);
      if (item) Object.assign(item, value);
      else data.posts.push({ id: uid(), date: today(), ...value });
    } else if (entity === "sessions") {
      if (op === "next") {
        const latest = data.sessions.toSorted((a, b) =>
          b.date.localeCompare(a.date),
        )[0];
        const date =
          latest && latest.date >= nextSaturday()
            ? addDays(latest.date, 7)
            : nextSaturday();
        const newId = uid();
        data.sessions.push({
          id: newId,
          date,
          time: "10:30",
          topic: "Community reflection",
          zoom: data.settings.autoZoom ? demoMeeting(newId) : "",
          pass: data.settings.autoZoom ? uid().slice(0, 6) : "",
          notes: "",
          podcast: "",
        });
      } else if (op === "regenerate") {
        const item = data.sessions.find((x) => x.id === id);
        if (!item) throw new Error("Session not found.");
        item.zoom = demoMeeting(uid());
        item.pass = uid().slice(0, 6);
      } else {
        const date = required(form, "date");
        if (!validDate(date) || new Date(date + "T12:00:00Z").getUTCDay() !== 6)
          throw new Error("Select a Saturday.");
        if (data.sessions.some((s) => s.date === date && s.id !== id))
          throw new Error("That Saturday already has a session.");
        const zoom = text(form, "zoom", 500);
        if (
          zoom &&
          !/^https:\/\/(?:[a-z0-9-]+\.)*(?:zoom\.us|zoom\.com|example\.invalid)\//i.test(
            zoom,
          )
        )
          throw new Error("Enter an HTTPS Zoom meeting URL.");
        const podcast = text(form, "podcast");
        if (podcast && !data.podcasts.some((p) => p.id === podcast))
          throw new Error("Choose an existing episode.");
        const value = {
          date,
          topic: required(form, "topic", 250),
          zoom,
          pass: text(form, "pass", 100),
          notes: text(form, "notes"),
          podcast,
        };
        const item = data.sessions.find((x) => x.id === id);
        if (item) Object.assign(item, value);
        else data.sessions.push({ id: uid(), time: "10:30", ...value });
      }
    } else if (entity === "podcasts") {
      const date = required(form, "date"),
        duration = required(form, "duration", 10);
      if (!validDate(date) || !/^\d{1,3}:[0-5]\d$/.test(duration))
        throw new Error("Enter a valid date and duration (mm:ss).");
      const value = {
        title: required(form, "title", 250),
        description: required(form, "description", 2000),
        date,
        duration,
        status: choice(form, "status", ["draft", "published"]),
      };
      const file = form.get("audio");
      let upload: { bytes: Uint8Array; type: string } | undefined;
      if (file instanceof File && file.size) {
        if (
          file.size > 10 * 1024 * 1024 ||
          ![
            "audio/mpeg",
            "audio/mp4",
            "audio/x-m4a",
            "audio/wav",
            "audio/x-wav",
            "audio/ogg",
          ].includes(file.type)
        )
          throw new Error(
            "Upload MP3, M4A, WAV or OGG audio, up to 10 MB for review.",
          );
        upload = {
          bytes: new Uint8Array(await file.arrayBuffer()),
          type: file.type,
        };
      }
      let item = data.podcasts.find((x) => x.id === id);
      if (!item) {
        item = {
          id: uid(),
          num: Math.max(0, ...data.podcasts.map((p) => p.num)) + 1,
          audioName: "",
          ...value,
        };
        data.podcasts.push(item);
      } else Object.assign(item, value);
      if (upload && file instanceof File) {
        getDemoState().audio.set(item.id, upload);
        item.audioName = file.name;
      }
    } else if (entity === "availability") {
      const availability: Record<string, string[]> = {};
      for (let day = 0; day < 7; day++)
        availability[day] = form
          .getAll(`day${day}`)
          .map(String)
          .filter((t) => /^(09|1\d|2[01]):00$/.test(t));
      const count = number(form, "consultsPerMonth", 0, 10);
      const duration = number(form, "consultMinutes", 15, 120);
      data.availability = availability as typeof data.availability;
      data.settings.consultsPerMonth = count;
      data.settings.consultMinutes = duration;
      data.settings.autoConfirm = form.has("autoConfirm");
    } else if (entity === "bookings") {
      const booking = data.bookings.find((b) => b.id === id);
      if (!booking || booking.status !== "pending")
        throw new Error("Only pending bookings can be confirmed.");
      booking.status = "confirmed";
      booking.zoom = demoMeeting(booking.id);
    } else if (entity === "announcements") {
      const count = await publishAnnouncement(form);
      return success(
        `Published to ${count} member${count === 1 ? "" : "s"} and prepared ${count} individual email${count === 1 ? "" : "s"}. Email delivery is not connected; nothing was sent.`,
      );
    } else if (entity === "siteImages") {
      return success(await updateSiteImage(form));
    } else if (entity === "siteCopy") {
      const allowed = new Map(
        copyCatalog.map((entry) => [entry.id, entry.text]),
      );
      const updates: Record<string, string> = {};
      for (const [key, value] of form.entries()) {
        if (!key.startsWith("copy:")) continue;
        const id = key.slice(5);
        if (
          !allowed.has(id) ||
          typeof value !== "string" ||
          value.length > 5000
        )
          throw new Error("One of the site text fields is invalid.");
        updates[id] = value;
      }
      const next = { ...data.siteCopy };
      for (const [id, value] of Object.entries(updates)) {
        if (value === allowed.get(id)) delete next[id];
        else next[id] = value;
      }
      data.siteCopy = next;
      return success("Site text saved.");
    } else if (entity === "content") {
      const value = {
        heroTitle: required(form, "heroTitle", 250),
        heroSub: required(form, "heroSub", 1000),
        topics: required(form, "topics")
          .split(/\r?\n/)
          .map((t) => t.trim())
          .filter(Boolean),
        meetingTime: required(form, "meetingTime", 20),
        meetingMinutes: number(form, "meetingMinutes", 15, 180),
        premiumPrice: number(form, "premiumPrice", 1, 1000),
        autoZoom: form.has("autoZoom"),
      };
      if (!/^(0?[1-9]|1[0-2]):[0-5]\d (AM|PM)$/.test(value.meetingTime))
        throw new Error("Use a time such as 10:30 AM.");
      Object.assign(data.settings, value);
    } else throw new Error("Unknown action.");
    return success("Changes saved for this review session.");
  } catch (error) {
    return errorResult(error);
  }
}
