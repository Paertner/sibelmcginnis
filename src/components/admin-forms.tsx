import { SiteSelect } from "./site-select";
import { ActionForm, ConfirmDelete } from "./action-form";
import { AdminDialog, AdminCancel } from "./admin-dialog";
import { adminMutation } from "@/lib/actions";
import { CoverField } from "./media-library";
import { BlocksField } from "./blocks-field";
import { textToBlocks } from "./block-content";
import type { MediaItem, SiteImage } from "@/lib/site-images";
import { fmtDate, today, nextSaturday } from "@/lib/dates";
import type {
  Episode,
  EventItem,
  Member,
  Post,
  Session,
  Store,
} from "@/lib/store";
type InputProps = {
  name: string;
  label: string;
  value?: string | number;
  type?: string;
  required?: boolean;
  multiline?: boolean;
};
export function Field({
  name,
  label,
  value,
  type = "text",
  required = true,
  multiline = false,
}: InputProps) {
  return (
    <label className="field">
      {label}
      {multiline ? (
        <textarea name={name} defaultValue={value} required={required} />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={value}
          required={required}
        />
      )}
    </label>
  );
}
export function Select({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value?: string | number;
  options: (string | [string, string])[];
}) {
  return (
    <SiteSelect
      name={name}
      label={label}
      defaultValue={value === undefined ? undefined : String(value)}
      options={options.map((o) => {
        const [value, label] = typeof o === "string" ? [o, o] : o;
        return { value, label };
      })}
    />
  );
}

export function EntityFields({ entity, id }: { entity: string; id?: string }) {
  return (
    <>
      <input name="entity" type="hidden" value={entity} />
      <input name="id" type="hidden" value={id ?? ""} />
    </>
  );
}
function Editor({
  title,
  entity,
  id,
  children,
  quiet = false,
  trigger,
  extraActions,
}: {
  title: string;
  entity: string;
  id?: string;
  children: React.ReactNode;
  quiet?: boolean;
  /** Extra buttons next to Delete, only shown when editing. */
  extraActions?: React.ReactNode;
  /** Show this text as a link-style trigger instead of the Edit button. */
  trigger?: string;
}) {
  return (
    <AdminDialog
      title={title}
      trigger={trigger ?? (id ? "Edit" : title)}
      primary={!id && !quiet}
      triggerClassName={trigger ? "name-trigger" : undefined}
      triggerLabel={trigger ? `${trigger}, edit member` : undefined}
    >
      <ActionForm
        action={adminMutation}
        actions={
          <>
            {id ? <ConfirmDelete /> : null}
            {id ? extraActions : null}
            <span className="form-actions-gap" />
            <AdminCancel />
          </>
        }
      >
        <EntityFields entity={entity} id={id} />
        {children}
      </ActionForm>
    </AdminDialog>
  );
}
export function MemberEditor({
  member,
  asName = false,
}: {
  member?: Member;
  /** Open the editor from the member's name instead of an Edit button. */
  asName?: boolean;
}) {
  return (
    <Editor
      title={member ? `Edit ${member.name}` : "+ Add member"}
      entity="members"
      id={member?.id}
      trigger={asName ? member?.name : undefined}
      extraActions={
        <button
          className="btn btn-sm btn-ghost"
          name="op"
          value="resetLink"
          formNoValidate
        >
          Create password link
        </button>
      }
    >
      <div className="row">
        <Field name="name" label="Full name" value={member?.name} />
        <Field name="email" label="Email" type="email" value={member?.email} />
      </div>
      <div className="row">
        <Select
          name="tier"
          label="Membership"
          value={member?.tier}
          options={["free", "premium"]}
        />
        <Select
          name="status"
          label="Status"
          value={member?.status}
          options={["active", "paused", "cancelled"]}
        />
      </div>
      <Field
        name="note"
        label="Private note"
        multiline
        required={false}
        value={member?.note}
      />
      <Field
        name="premiumUntil"
        label="Premium access ends (UTC)"
        type="datetime-local"
        value={member?.premiumUntil?.slice(0, 16) ?? ""}
        required={false}
      />
      <p className="hint">
        Access ends at this time even if the membership is still labelled
        Premium. A live subscription service will keep this date up to date.
      </p>
    </Editor>
  );
}
function WideEditor({
  title,
  entity,
  id,
  quiet = false,
  main,
  side,
}: {
  title: string;
  entity: string;
  id?: string;
  quiet?: boolean;
  main: React.ReactNode;
  side: React.ReactNode;
}) {
  return (
    <AdminDialog
      title={title}
      trigger={id ? "Edit" : title}
      primary={!id && !quiet}
      wide
    >
      <ActionForm
        action={adminMutation}
        className="wide-editor"
        actions={
          <>
            {id ? <ConfirmDelete /> : null}
            <span className="form-actions-gap" />
            <AdminCancel />
          </>
        }
      >
        <EntityFields entity={entity} id={id} />
        <div className="wide-editor-main">{main}</div>
        <aside className="wide-editor-side">{side}</aside>
      </ActionForm>
    </AdminDialog>
  );
}
function AudioField({
  current,
  label,
  hint,
}: {
  current?: string;
  label: string;
  hint: string;
}) {
  return (
    <div className="field audio-field">
      <label>
        {label}
        <input
          type="file"
          name="audio"
          accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav,audio/ogg"
        />
      </label>
      <small className="setting-hint">
        {current ? `Current: ${current}. ` : ""}
        {hint}
      </small>
    </div>
  );
}
export function PostEditor({
  post,
  cover,
  media,
}: {
  post?: Post;
  cover: SiteImage;
  media: MediaItem[];
}) {
  return (
    <WideEditor
      title={post ? `Edit: ${post.title}` : "+ New blog post"}
      entity="posts"
      id={post?.id}
      main={
        <>
          <input
            className="wide-editor-title"
            name="title"
            defaultValue={post?.title}
            placeholder="Post title"
            aria-label="Title"
            required
            maxLength={250}
          />
          <BlocksField
            label="Post content"
            initial={post ? (post.blocks ?? textToBlocks(post.body)) : []}
            media={media}
          />
        </>
      }
      side={
        <>
          <Select
            name="status"
            label="Status"
            value={post?.status ?? "draft"}
            options={["draft", "published"]}
          />
          <Select
            name="access"
            label="Who can read this post?"
            value={post?.access ?? "public"}
            options={[
              ["public", "Everyone"],
              ["premium", "Premium members"],
            ]}
          />
          <Field
            name="category"
            label="Category"
            value={post?.category ?? "Mindset"}
          />
          <Field
            name="slug"
            label="Web address: /post/…"
            value={post?.slug ?? ""}
            required={false}
          />
          <input type="hidden" name="cover" value={post?.cover ?? 0} />
          <CoverField
            key={`${cover.mediaId}|${cover.alt}|${cover.position}`}
            cover={{
              ...cover,
              group: "Blog post",
              label: post?.title ?? "New post",
            }}
            media={media}
          />
          <Field
            name="excerpt"
            label="Short excerpt"
            value={post?.excerpt}
            multiline
          />
          <AudioField
            label="Audio version (optional)"
            current={post?.audioName}
            hint="MP3, M4A, WAV or OGG up to 10 MB. Only readers of this post can play it."
          />
          {post?.audioName ? (
            <label className="checkbox-field">
              <input type="checkbox" name="removeAudio" /> Remove the audio
            </label>
          ) : null}
        </>
      }
    />
  );
}
export function EventEditor({
  event,
  cover,
  media,
}: {
  event?: EventItem;
  cover: SiteImage;
  media: MediaItem[];
}) {
  return (
    <WideEditor
      title={event ? `Edit: ${event.title}` : "+ New event"}
      entity="events"
      id={event?.id}
      main={
        <>
          <input
            className="wide-editor-title"
            name="title"
            defaultValue={event?.title}
            placeholder="Event title"
            aria-label="Title"
            required
            maxLength={250}
          />
          <BlocksField
            label="Event description"
            initial={event?.blocks ?? []}
            media={media}
          />
        </>
      }
      side={
        <>
          <Select
            name="status"
            label="Status"
            value={event?.status ?? "draft"}
            options={["draft", "published"]}
          />
          <Field
            name="date"
            label="Date"
            type="date"
            value={event?.date ?? today()}
          />
          <div className="row">
            <Field
              name="start"
              label="Starts"
              type="time"
              value={event?.start ?? "10:00"}
            />
            <Field
              name="end"
              label="Ends"
              type="time"
              value={event?.end ?? "12:00"}
            />
          </div>
          <Field name="venue" label="Venue name" value={event?.venue} />
          <Field name="address" label="Address" value={event?.address} />
          <Field
            name="mapUrl"
            label="Map link (optional)"
            type="url"
            value={event?.mapUrl}
            required={false}
          />
          <div className="row">
            <Field
              name="seats"
              label="Seat limit"
              type="number"
              value={event?.seats ?? 20}
            />
            <Field
              name="price"
              label="Price"
              value={event?.price ?? "Free"}
              required={false}
            />
          </div>
          <small className="setting-hint">
            Paid events show the price and a “Payment comes later” note. No
            payment is taken yet.
          </small>
          <CoverField
            key={`${cover.mediaId}|${cover.alt}|${cover.position}`}
            cover={{
              ...cover,
              group: "Events",
              label: event?.title ?? "New event",
            }}
            media={media}
          />
          <Field
            name="summary"
            label="Short summary"
            value={event?.summary}
            multiline
          />
        </>
      }
    />
  );
}
export function SessionEditor({
  session,
  episodes,
  media = [],
}: {
  session?: Session;
  episodes: Episode[];
  media?: MediaItem[];
}) {
  const episode = episodes.find((ep) => ep.id === session?.podcast);
  return (
    <WideEditor
      title={
        session
          ? `Edit ${fmtDate(session.date, { month: "short", day: "numeric" })}: ${session.topic}`
          : "Add a session"
      }
      entity="sessions"
      id={session?.id}
      quiet
      main={
        <>
          <input
            className="wide-editor-title"
            name="topic"
            defaultValue={session?.topic}
            placeholder="Session topic"
            aria-label="Topic"
            required
            maxLength={250}
          />
          <BlocksField
            label="Session notes"
            initial={
              session ? (session.blocks ?? textToBlocks(session.notes)) : []
            }
            media={media}
          />
        </>
      }
      side={
        <>
          <Field
            name="date"
            label="Saturday date"
            value={session?.date ?? nextSaturday()}
            type="date"
          />
          <Field
            name="slug"
            label="Web address: /session/…"
            value={session?.slug ?? ""}
            required={false}
          />
          <Field
            name="zoom"
            label="Zoom meeting link (HTTPS)"
            value={session?.zoom}
            required={false}
            type="url"
          />
          <Field
            name="pass"
            label="Passcode"
            value={session?.pass}
            required={false}
          />
          <Select
            name="podcast"
            label="Podcast episode"
            value={session?.podcast ?? ""}
            options={[
              ["", "None"],
              ...episodes.map(
                (ep) => [ep.id, `#${ep.num} ${ep.title}`] as [string, string],
              ),
            ]}
          />
          <AudioField
            label="Session audio"
            current={episode?.audioName}
            hint="Upload the audio of these notes. It becomes this session’s podcast episode (created if none is linked)."
          />
        </>
      }
    />
  );
}
export function EpisodeEditor({ episode }: { episode?: Episode }) {
  return (
    <Editor
      title={
        episode ? `Edit #${episode.num}: ${episode.title}` : "+ New episode"
      }
      entity="podcasts"
      id={episode?.id}
    >
      <Field name="title" label="Title" value={episode?.title} />
      <Field
        name="description"
        label="Description"
        value={episode?.description}
        multiline
      />
      <div className="row">
        <Field
          name="date"
          label="Release date"
          type="date"
          value={episode?.date ?? today()}
        />
        <Field
          name="duration"
          label="Length (mm:ss)"
          value={episode?.duration ?? "30:00"}
        />
        <Select
          name="status"
          label="Status"
          value={episode?.status ?? "published"}
          options={["draft", "published"]}
        />
      </div>
      <label className="field">
        Audio file (MP3, M4A, WAV or OGG)
        <input
          type="file"
          name="audio"
          accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav,audio/ogg"
        />
      </label>
      <p className="hint">
        {episode?.audioName
          ? `Current: ${episode.audioName}. `
          : "No audio uploaded. "}
        Up to 10 MB. Members only see Published episodes; Draft stays hidden.
      </p>
    </Editor>
  );
}
export function ContentForm({ settings }: { settings: Store["settings"] }) {
  return (
    <ActionForm action={adminMutation} className="admin-content-form">
      <EntityFields entity="content" />
      <div className="panel">
        <h3>Homepage</h3>
        <Field name="heroTitle" label="Headline" value={settings.heroTitle} />
        <Field
          name="heroSub"
          label="Intro text"
          value={settings.heroSub}
          multiline
        />
        <Field
          name="topics"
          label="Topics (one per line)"
          value={settings.topics.join("\n")}
          multiline
        />
      </div>
      <div className="panel">
        <h3>Membership</h3>
        <div className="row">
          <Field
            name="premiumPrice"
            label="Premium price ($ / month)"
            type="number"
            value={settings.premiumPrice}
          />
          <Field
            name="meetingTime"
            label="Saturday meeting time (10:30 AM)"
            value={settings.meetingTime}
          />
          <Field
            name="meetingMinutes"
            label="Meeting length (minutes)"
            type="number"
            value={settings.meetingMinutes}
          />
        </div>
        <label className="checkbox-field">
          <input
            type="checkbox"
            name="autoZoom"
            defaultChecked={settings.autoZoom}
          />{" "}
          Create a distinct placeholder meeting for each new Saturday during
          review
        </label>
      </div>
    </ActionForm>
  );
}
