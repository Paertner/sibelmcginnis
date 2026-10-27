"use client";
import { useActionState, useLayoutEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { adminMutation } from "@/lib/actions";
import { emailTemplates } from "@/lib/email-templates";
import type { ActionResult } from "./action-form";

type Recipient = { id: string; name: string; email: string; tier: string };
const clean = (html: string) =>
  DOMPurify.sanitize(html, {
    FORBID_TAGS: [
      "style",
      "script",
      "form",
      "input",
      "button",
      "iframe",
      "object",
      "embed",
      "video",
      "audio",
    ],
    FORBID_ATTR: ["srcset"],
  });
export function AnnouncementComposer({ members }: { members: Recipient[] }) {
  const [selected, setSelected] = useState<string[]>([]),
    [groups, setGroups] = useState<string[]>([]);
  const [query, setQuery] = useState(""),
    [highlight, setHighlight] = useState(0);
  const [template, setTemplate] = useState<string>(emailTemplates[0].id),
    [subject, setSubject] = useState<string>(emailTemplates[0].subject);
  const [html, setHtml] = useState<string>(emailTemplates[0].html),
    [mode, setMode] = useState<"visual" | "html">("visual");
  const [preview, setPreview] = useState(false),
    [image, setImage] = useState(""),
    [fileError, setFileError] = useState("");
  const editor = useRef<HTMLDivElement>(null),
    upload = useRef<HTMLInputElement>(null),
    search = useRef<HTMLInputElement>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  useLayoutEffect(() => {
    if (mode === "visual" && editor.current) {
      const sanitized = clean(html);
      if (editor.current.innerHTML !== sanitized)
        editor.current.innerHTML = sanitized;
    }
  }, [html, mode]);
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    async (previous, form) => {
      if (attachment) form.set("image", attachment);
      const result = await adminMutation(previous, form);
      if (result.ok) {
        setImage("");
        setAttachment(null);
      }
      return result;
    },
    { message: "" },
  );
  const matches = members
    .filter(
      (m) =>
        !selected.includes(m.id) &&
        `${m.name} ${m.email}`.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 6);
  const count = members.filter(
    (m) =>
      selected.includes(m.id) ||
      groups.includes("all") ||
      groups.includes(m.tier),
  ).length;
  const add = (id: string) => {
    setSelected((previous) => [...new Set([...previous, id])]);
    setQuery("");
    setHighlight(0);
    search.current?.focus();
  };
  const loadTemplate = (id: string) => {
    const next = emailTemplates.find((t) => t.id === id);
    if (
      !next ||
      (html !== emailTemplates.find((t) => t.id === template)?.html &&
        !window.confirm(
          "Replace the current message with this template? Your message edits will be replaced.",
        ))
    )
      return;
    setTemplate(id);
    setSubject(next.subject);
    setHtml(clean(next.html));
    if (editor.current) editor.current.innerHTML = clean(next.html);
  };
  const changeMode = (next: "visual" | "html") => {
    setHtml(clean(html));
    setMode(next);
  };
  const command = (name: string) => {
    editor.current?.focus();
    document.execCommand(name);
    if (editor.current) setHtml(editor.current.innerHTML);
  };
  const previewHtml = preview
    ? clean(html)
        .replaceAll("{{first_name}}", "Amelia")
        .replaceAll("{{account_url}}", "/account")
    : "";
  return (
    <form action={action} className="composer panel">
      <input type="hidden" name="entity" value="announcements" />
      <div className="composer-heading">
        <span className="pill">A note from Sibel</span>
        <h2>New announcement</h2>
        <p>Share a conversation, a reflection, or a personal note.</p>
      </div>
      <fieldset className="recipient-field">
        <legend>Send to</legend>
        <div className="recipient-chips">
          {groups.map((group) => (
            <span className="recipient-chip group-chip" key={group}>
              @{group}
              <button
                type="button"
                aria-label={`Remove @${group}`}
                onClick={() => setGroups(groups.filter((g) => g !== group))}
              >
                ×
              </button>
              <input name="groups" type="hidden" value={group} />
            </span>
          ))}
          {selected.map((id) => {
            const m = members.find((m) => m.id === id)!;
            return (
              <span className="recipient-chip" key={id}>
                {m.name}
                <button
                  type="button"
                  aria-label={`Remove ${m.name}`}
                  onClick={() => setSelected(selected.filter((x) => x !== id))}
                >
                  ×
                </button>
                <input name="recipients" type="hidden" value={id} />
              </span>
            );
          })}
        </div>
        <div className="recipient-search">
          <input
            ref={search}
            role="combobox"
            aria-label="Add registered members"
            aria-controls="recipient-options"
            aria-expanded={!!query}
            aria-autocomplete="list"
            aria-activedescendant={
              query && matches[highlight]
                ? `recipient-${matches[highlight].id}`
                : undefined
            }
            placeholder="Type a member’s name or email…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlight((i) => Math.min(i + 1, matches.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((i) => Math.max(0, i - 1));
              }
              if (e.key === "Enter") {
                e.preventDefault();
                if (query && matches[highlight]) add(matches[highlight].id);
              }
              if (e.key === "Escape") setQuery("");
            }}
          />
          {query ? (
            <div
              id="recipient-options"
              role="listbox"
              aria-label="Matching members"
              className="recipient-options"
            >
              {matches.length ? (
                matches.map((m, index) => (
                  <button
                    type="button"
                    id={`recipient-${m.id}`}
                    role="option"
                    aria-selected={index === highlight}
                    key={m.id}
                    onClick={() => add(m.id)}
                  >
                    <span className="avatar">
                      {m.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <span>
                      <b>{m.name}</b>
                      <small>{m.email}</small>
                    </span>
                    <span className={`badge b-${m.tier}`}>{m.tier}</span>
                  </button>
                ))
              ) : (
                <p>
                  No registered member found. External addresses cannot be
                  added.
                </p>
              )}
            </div>
          ) : null}
        </div>
        <div className="group-shortcuts">
          {["all", "free", "premium"].map((group) => (
            <button
              type="button"
              className={`group-shortcut ${groups.includes(group) ? "on" : ""}`}
              key={group}
              aria-pressed={groups.includes(group)}
              onClick={() =>
                setGroups(
                  groups.includes(group)
                    ? groups.filter((g) => g !== group)
                    : [...groups, group],
                )
              }
            >
              @{group}
            </button>
          ))}
          <span className="recipient-count" aria-live="polite">
            {count} unique recipient{count === 1 ? "" : "s"}
          </span>
        </div>
        <p className="hint">
          Registered members only. A person selected individually and through a
          group receives one message.
        </p>
      </fieldset>
      <label className="field">
        Subject
        <input
          name="subject"
          required
          maxLength={250}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </label>
      <fieldset className="template-picker">
        <legend>Start with a template</legend>
        <div className="template-options">
          {emailTemplates.map((t, index) => (
            <button
              type="button"
              key={t.id}
              className={`template-option ${template === t.id ? "selected" : ""}`}
              aria-pressed={template === t.id}
              onClick={() => loadTemplate(t.id)}
            >
              <span
                className={`template-thumbnail template-${t.id}`}
                aria-hidden="true"
              >
                <i />
                <i />
                <i />
                <b>{String(index + 1).padStart(2, "0")}</b>
              </span>
              <strong>{t.name}</strong>
              <small>{t.description}</small>
            </button>
          ))}
        </div>
      </fieldset>
      <div className="message-header">
        <label id="message-label">Message</label>
        <div className="editor-mode" role="group" aria-label="Editor mode">
          <button
            type="button"
            aria-pressed={mode === "visual"}
            onClick={() => changeMode("visual")}
          >
            Visual editor
          </button>
          <button
            type="button"
            aria-pressed={mode === "html"}
            onClick={() => changeMode("html")}
          >
            HTML code
          </button>
        </div>
      </div>
      <input name="html" type="hidden" value={html} />
      {mode === "visual" ? (
        <div className="email-editor">
          <div
            className="editor-toolbar"
            role="toolbar"
            aria-label="Text formatting"
          >
            {[
              ["bold", "Bold"],
              ["italic", "Italic"],
              ["underline", "Underline"],
              ["insertUnorderedList", "Bulleted list"],
              ["undo", "Undo"],
            ].map(([cmd, label]) => (
              <button
                key={cmd}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => command(cmd)}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            ref={editor}
            role="textbox"
            aria-labelledby="message-label"
            aria-multiline="true"
            contentEditable
            suppressContentEditableWarning
            className="email-canvas"
            onBlur={(e) => setHtml(e.currentTarget.innerHTML)}
            onPaste={(e) => {
              e.preventDefault();
              const pasted = clean(
                e.clipboardData.getData("text/html") ||
                  DOMPurify.sanitize(
                    e.clipboardData.getData("text/plain"),
                  ).replace(/\n/g, "<br>"),
              );
              const selection = window.getSelection();
              if (selection?.rangeCount) {
                const range = selection.getRangeAt(0);
                if (editor.current?.contains(range.commonAncestorContainer)) {
                  range.deleteContents();
                  const fragment = range.createContextualFragment(pasted);
                  const last = fragment.lastChild;
                  range.insertNode(fragment);
                  if (last) {
                    range.setStartAfter(last);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                  }
                }
              }
              if (editor.current) setHtml(editor.current.innerHTML);
            }}
          />
        </div>
      ) : (
        <textarea
          className="html-source"
          aria-label="Message HTML code"
          value={html}
          maxLength={150000}
          onChange={(e) => setHtml(e.target.value)}
          spellCheck={false}
        />
      )}
      <p className="hint">
        Edit the template text or paste your HTML. {"{{first_name}}"}{" "}
        personalizes each email; {"{{account_url}}"} opens the member account.
        Unsafe scripts are removed when published.
      </p>
      <div className="image-upload">
        <div>
          <h3>
            Session image <span className="muted">(optional)</span>
          </h3>
          <p>
            Add a photo for this session. It appears above the message and is
            embedded in the email.
          </p>
        </div>
        <label className="field">
          Upload session image
          <input
            ref={upload}
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setFileError("");
              setImage("");
              setAttachment(null);
              if (!file) return;
              if (
                file.size > 3 * 1024 * 1024 ||
                !["image/jpeg", "image/png", "image/webp"].includes(file.type)
              ) {
                setFileError("Choose a JPG, PNG or WebP image up to 3 MB.");
                e.target.value = "";
                return;
              }
              const reader = new FileReader();
              setAttachment(file);
              reader.onload = () => setImage(String(reader.result));
              reader.readAsDataURL(file);
            }}
          />
        </label>
        {image ? (
          <button
            className="btn btn-sm btn-ghost"
            type="button"
            onClick={() => {
              setImage("");
              setAttachment(null);
              if (upload.current) upload.current.value = "";
            }}
          >
            Remove image
          </button>
        ) : null}
        {fileError ? (
          <p className="form-feedback error" role="alert">
            {fileError}
          </p>
        ) : null}
        <small>JPG, PNG or WebP · up to 3 MB</small>
        {attachment ? (
          <p className="selected-image">Selected: {attachment.name}</p>
        ) : null}
      </div>
      <div className="composer-actions">
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => {
            if (editor.current) setHtml(editor.current.innerHTML);
            setPreview(!preview);
          }}
        >
          {preview ? "Hide preview" : "Preview email"}
        </button>
        <button className="btn" disabled={pending || !count || !!fileError}>
          {pending ? "Preparing…" : "Publish & prepare email"}
        </button>
      </div>
      {preview ? (
        <iframe
          title="Email preview"
          className="email-preview"
          sandbox=""
          srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#f5f5f5}img{max-width:100%}table{max-width:100%}</style></head><body>${image ? `<img src="${image}" alt="Session image" style="display:block;width:100%;max-width:600px;margin:auto">` : ""}${previewHtml}</body></html>`}
        />
      ) : null}
      <p className="composer-delivery-note">
        Your announcement appears only in the selected members’ accounts. An
        individual email draft is prepared for each recipient. Email delivery is
        not connected in this review.
      </p>
      {state.message ? (
        <p
          className={`form-feedback ${state.ok ? "success" : "error"}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
