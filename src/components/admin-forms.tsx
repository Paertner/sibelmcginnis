import { SiteSelect } from "./site-select";
import { ActionForm, ConfirmDelete } from "./action-form";
import { AdminDialog, AdminCancel } from "./admin-dialog";
import { adminMutation } from "@/lib/actions";
import { today, nextSaturday } from "@/lib/dates";
import type { Episode, Member, Post, Session, Store } from "@/lib/store";
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
}: {
  title: string;
  entity: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <AdminDialog title={title} trigger={id ? "Edit" : title} primary={!id}>
      <ActionForm action={adminMutation}>
        <EntityFields entity={entity} id={id} />
        {children}
        <div className="editor-delete">
          {id ? <ConfirmDelete /> : null}
          <AdminCancel />
        </div>
      </ActionForm>
    </AdminDialog>
  );
}
export function MemberEditor({ member }: { member?: Member }) {
  return (
    <Editor
      title={member ? `Edit ${member.name}` : "+ Add member"}
      entity="members"
      id={member?.id}
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
export function PostEditor({ post }: { post?: Post }) {
  return (
    <Editor
      title={post ? `Edit: ${post.title}` : "+ New blog post"}
      entity="posts"
      id={post?.id}
    >
      <Field name="title" label="Title" value={post?.title} />
      <div className="row">
        <Field
          name="category"
          label="Category"
          value={post?.category ?? "Mindset"}
        />
        <Select
          name="status"
          label="Status"
          value={post?.status ?? "draft"}
          options={["draft", "published"]}
        />
      </div>
      <div className="row">
        <Select
          name="access"
          label="Who can read this post?"
          value={post?.access ?? "public"}
          options={[
            ["public", "Everyone"],
            ["free", "Free members"],
            ["premium", "Premium members"],
          ]}
        />
        <Select
          name="cover"
          label="Cover photo"
          value={post?.cover ?? 0}
          options={[
            ["0", "Community gathering"],
            ["1", "Coaching"],
            ["2", "Sibel"],
          ]}
        />
      </div>
      <Field
        name="excerpt"
        label="Short excerpt"
        value={post?.excerpt}
        multiline
      />
      <Field
        name="body"
        label="Post (separate paragraphs with a blank line)"
        value={post?.body}
        multiline
      />
    </Editor>
  );
}
export function SessionEditor({
  session,
  episodes,
}: {
  session?: Session;
  episodes: Episode[];
}) {
  return (
    <Editor
      title={
        session ? `Edit ${session.date}: ${session.topic}` : "+ Add session"
      }
      entity="sessions"
      id={session?.id}
    >
      <div className="row">
        <Field
          name="date"
          label="Saturday date"
          value={session?.date ?? nextSaturday()}
          type="date"
        />
        <Field name="topic" label="Topic" value={session?.topic} />
      </div>
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
      <Field
        name="notes"
        label="Post-meeting notes"
        value={session?.notes}
        multiline
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
    </Editor>
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
          value={episode?.status ?? "draft"}
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
        Up to 10 MB for local review. Uploads last until the server restarts.
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
