import { deleteMedia, updateSiteImage, uploadMedia } from "./site-images";
import copyCatalog from "./site-copy-catalog.json";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { navigate } from "../../preview/shims/navigation";
import { clearSession, getUser, setDemoSession } from "./auth";
import { demoEnabled, demoMeeting, getDemoState, getStore } from "./store";
import { addDays, nextSaturday, today } from "./dates";
import { isPremium } from "./access";
import type { ActionResult } from "@/components/action-form";
import { publishAnnouncement } from "./announcements";
import { parseBlocks } from "./email-blocks";
import { emailCategories, type EmailPreferences } from "./email-preferences";

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
const audioTypes = [
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
];
/** Validates an optional uploaded audio file (MP3, M4A, WAV or OGG, up to 10 MB). */
async function readAudio(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || !file.size) return undefined;
  if (file.size > 10 * 1024 * 1024 || !audioTypes.includes(file.type))
    throw new Error("Upload MP3, M4A, WAV or OGG audio, up to 10 MB for review.");
  return {
    bytes: new Uint8Array(await file.arrayBuffer()),
    type: file.type,
    name: file.name.replace(/[\r\n"\\]/g, "_").slice(0, 100),
  };
}
/** Plain text of blocks, kept as the post body for search, excerpts and emails. */
const blocksText = (blocks: ReturnType<typeof parseBlocks>) =>
  blocks
    .map((block) =>
      [block.title, block.text, block.html, block.label]
        .filter(Boolean)
        .join(" ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .join("\n\n");
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
  return navigate(id === "admin" ? "/admin" : "/account");
}
export async function signOut() {
  await clearSession();
  return navigate("/");
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
    // The prototype checks passwords but never stores them; real accounts arrive with the back end.
    const password = String(form.get("password") ?? "");
    if (password.length < 8)
      throw new Error("Use a password with at least 8 characters.");
    if (password !== String(form.get("repeatPassword") ?? ""))
      throw new Error("The two passwords don’t match.");
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
  return navigate("/account");
}
export async function contact(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    required(form, "name", 120);
    email(form);
    required(form, "message");
    const preferred = text(form, "preferredTime", 16);
    if (
      preferred &&
      (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(preferred) ||
        !validDate(preferred.slice(0, 10)))
    )
      throw new Error("Choose a valid date and time for a call.");
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
/** Saves which emails the signed-in member wants (the target of the unsubscribe link). */
export async function saveEmailPreferences(
  _state: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    checkDemo();
    const user = await getUser();
    if (!user || user.role === "admin")
      throw new Error("Sign in as a member first.");
    const member = getStore().members.find((m) => m.id === user.id);
    if (!member) throw new Error("Member not found.");
    const unsubscribedAll = form.get("unsubscribeAll") === "on";
    const next: EmailPreferences = { unsubscribedAll };
    for (const category of emailCategories)
      next[category.field] = form.get(category.field) === "on";
    member.emailPreferences = next;
    return success(
      unsubscribedAll
        ? "You are unsubscribed from all emails. You can turn them back on here at any time."
        : "Your email preferences are saved.",
    );
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
          getDemoState().audio.delete(`post-${id}`);
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
      const blocks = parseBlocks(text(form, "blocks", 400000));
      if (!blocksText(blocks)) throw new Error("Add some content to the post.");
      const value = {
        title: required(form, "title", 250),
        category: required(form, "category", 100),
        excerpt: required(form, "excerpt", 500),
        blocks,
        body: blocksText(blocks),
        access: choice(form, "access", ["public", "premium"]),
        status: choice(form, "status", ["draft", "published"]),
        cover: number(form, "cover", 0, 2),
      };
      const item = data.posts.find((x) => x.id === id);
      const postId = item?.id ?? uid();
      if (item) Object.assign(item, value);
      else data.posts.push({ id: postId, date: today(), ...value });
      const post = data.posts.find((x) => x.id === postId)!;
      // Posts can carry an audio version, made elsewhere and uploaded here.
      const audio = await readAudio(form.get("audio"));
      if (audio) {
        getDemoState().audio.set(`post-${postId}`, audio);
        post.audioName = audio.name;
      } else if (form.get("removeAudio") === "on") {
        getDemoState().audio.delete(`post-${postId}`);
        post.audioName = "";
      }
      // A cover chosen in the media picker becomes this post's own image.
      const coverMedia = text(form, "coverMedia", 200);
      if (coverMedia) {
        const cover = new FormData();
        cover.set("slot", `post.${postId}`);
        cover.set("media", coverMedia);
        cover.set("alt", text(form, "coverAlt", 300));
        cover.set("position", text(form, "coverPosition", 40) || "center");
        await updateSiteImage(cover);
      }
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
        // Notes are written with the block editor; their plain text stays in `notes`.
        const blocks = parseBlocks(text(form, "blocks", 400000));
        const topic = required(form, "topic", 250);
        const value = {
          date,
          topic,
          zoom,
          pass: text(form, "pass", 100),
          notes: blocksText(blocks),
          blocks,
          podcast,
        };
        const item = data.sessions.find((x) => x.id === id);
        const sessionId = item?.id ?? uid();
        if (item) Object.assign(item, value);
        else data.sessions.push({ id: sessionId, time: "10:30", ...value });
        const session = data.sessions.find((x) => x.id === sessionId)!;
        // The session's audio is its podcast episode: update the linked one or create it.
        const audio = await readAudio(form.get("audio"));
        if (audio) {
          let episode = data.podcasts.find((p) => p.id === session.podcast);
          if (!episode) {
            episode = {
              id: uid(),
              num: Math.max(0, ...data.podcasts.map((p) => p.num)) + 1,
              title: topic,
              description: `Saturday circle, ${date}.`,
              date,
              duration: "30:00",
              status: "published",
              audioName: "",
            };
            data.podcasts.push(episode);
            session.podcast = episode.id;
          }
          getDemoState().audio.set(episode.id, audio);
          episode.audioName = audio.name;
        }
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
        throw new Error("Only bookings waiting for approval can be changed.");
      // A declined request is cancelled, which frees the time for others.
      if (op === "reject") {
        booking.status = "cancelled";
        return success("Booking declined. The time is open again.");
      }
      booking.status = "confirmed";
      booking.zoom = demoMeeting(booking.id);
      return success("Booking approved. The member can now join.");
    } else if (entity === "announcements") {
      const { recipients, emails, skipped } = await publishAnnouncement(form);
      return success(
        `Published to ${recipients} member${recipients === 1 ? "" : "s"} and prepared ${emails} individual email${emails === 1 ? "" : "s"}.${skipped ? ` ${skipped} ${skipped === 1 ? "person was" : "people were"} skipped because of their email preferences.` : ""} Email delivery is not connected; nothing was sent.`,
      );
    } else if (entity === "siteImages") {
      return success(await updateSiteImage(form));
    } else if (entity === "siteSettings") {
      const link = (key: string, label: string) => {
        const value = text(form, key, 300);
        if (value && !/^https:\/\/\S+$/i.test(value))
          throw new Error(`Enter a full https:// link for ${label}.`);
        return value;
      };
      const contactEmail = text(form, "contactEmail", 254).toLowerCase();
      if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
        throw new Error("Enter a valid contact email.");
      const faviconPath = text(form, "faviconPath", 300);
      if (faviconPath && !/^\/(images|api\/site-image)\/[\w.-]+$/.test(faviconPath))
        throw new Error("Choose the favicon from the media library.");
      data.siteSettings = {
        siteTitle: required(form, "siteTitle", 80),
        tagline: text(form, "tagline", 160),
        faviconPath,
        contactEmail,
        mailingAddress: text(form, "mailingAddress", 300),
        facebook: link("facebook", "Facebook"),
        instagram: link("instagram", "Instagram"),
        linkedin: link("linkedin", "LinkedIn"),
      };
      return success("Site settings saved.");
    } else if (entity === "integrations") {
      const integrations = { ...data.integrations },
        now = new Date().toISOString();
      let message = "Saved.";
      if (op === "stripe-connect") {
        // The live site sends the admin to Stripe to sign in (Stripe Connect); the prototype simulates the result.
        integrations.stripe = {
          connected: true,
          accountName: data.siteSettings?.siteTitle || "Sibel McGinnis",
          accountId: `acct_test_${uid().replace(/-/g, "").slice(0, 10)}`,
          connectedAt: now,
        };
        message = "Stripe connected in test mode.";
      } else if (op === "stripe-disconnect") {
        integrations.stripe = { connected: false };
        message = "Stripe disconnected.";
      } else if (op === "zoom") {
        const secret = text(form, "clientSecret", 200);
        integrations.zoom = {
          accountId: text(form, "accountId", 100),
          clientId: text(form, "clientId", 100),
          secretTail: secret ? secret.slice(-4) : integrations.zoom?.secretTail,
          savedAt: now,
        };
        message = "Zoom details saved.";
      } else if (op === "resend") {
        const key = text(form, "apiKey", 200);
        if (key && !key.startsWith("re_"))
          throw new Error("A Resend API key starts with re_.");
        const fromEmail = text(form, "fromEmail", 254).toLowerCase();
        if (fromEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail))
          throw new Error("Enter a valid sender email.");
        integrations.resend = {
          fromName: text(form, "fromName", 80),
          fromEmail,
          keyTail: key ? key.slice(-4) : integrations.resend?.keyTail,
          savedAt: now,
          dailyLimit: number(form, "dailyLimit", 1, 100000),
        };
        message = "Email settings saved.";
      } else throw new Error("Unknown setting.");
      data.integrations = integrations;
      return success(message);
    } else if (entity === "emailTemplates") {
      if (op === "remove") {
        data.emailTemplates = (data.emailTemplates ?? []).filter(
          (template) => template.id !== id,
        );
        return success("Template deleted.");
      }
      const value = {
        name: required(form, "name", 80),
        subject: required(form, "subject", 250),
        blocks: parseBlocks(text(form, "blocks", 400000)),
        footer: form.get("footer") === "on",
        updatedAt: new Date().toISOString(),
      };
      const existing = (data.emailTemplates ?? []).find((t) => t.id === id);
      if (existing) {
        Object.assign(existing, value);
        return { ...success(`“${value.name}” updated.`), id: existing.id };
      }
      const templateId = uid();
      data.emailTemplates = [
        ...(data.emailTemplates ?? []),
        { id: templateId, ...value },
      ];
      return { ...success(`Saved as “${value.name}”.`), id: templateId };
    } else if (entity === "emailFooter") {
      data.emailFooter = parseBlocks(text(form, "blocks", 200000));
      return success("Footer saved. It is used by every email that includes it.");
    } else if (entity === "media") {
      if (op === "remove") return success(await deleteMedia(form));
      const { id: mediaId, message } = await uploadMedia(form);
      return { ...success(message), id: mediaId };
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
