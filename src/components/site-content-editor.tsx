"use client";
import { useMemo, useState } from "react";
import catalog from "@/lib/site-copy-catalog.json";
import { adminMutation } from "@/lib/actions";
import { ActionForm, type ActionResult } from "./action-form";
import { SiteSelect } from "./site-select";

const groups = [...new Set(catalog.map((entry) => entry.group))];
export function SiteContentEditor({
  values,
}: {
  values: Record<string, string>;
}) {
  const [group, setGroup] = useState("Homepage"),
    [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const fields = useMemo(
    () =>
      catalog.filter(
        (entry) =>
          entry.group === group &&
          `${entry.text} ${values[entry.id] ?? ""}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [group, query, values],
  );
  const dirty = Object.keys(drafts).length;
  const save = async (state: ActionResult, data: FormData) => {
    const result = await adminMutation(state, data);
    if (result.ok) setDrafts({});
    return result;
  };
  return (
    <section className="panel content-copy-editor">
      <h3>All site text</h3>
      <p className="muted">
        Edit headings, descriptions, buttons, menus, form labels and other
        static copy. Choose a page or shared section below. Posts, podcast
        episodes and announcements have their own editors.
      </p>
      <div className="content-copy-toolbar">
        <SiteSelect
          label="Page or section"
          value={group}
          onValueChange={setGroup}
          options={groups.map((value) => ({ value, label: value }))}
        />
        <label className="field">
          Find text in this section
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search words or phrases…"
          />
        </label>
      </div>
      <p className="hint">
        {fields.length} text fields ·{" "}
        {dirty
          ? `${dirty} unsaved change${dirty === 1 ? "" : "s"}`
          : "No unsaved changes"}
        . Text is displayed as plain text.
      </p>
      <ActionForm
        action={save}
        submitLabel="Save site text"
        submitDisabled={!dirty}
      >
        <input type="hidden" name="entity" value="siteCopy" />
        {Object.entries(drafts).map(([id, value]) => (
          <input key={id} type="hidden" name={`copy:${id}`} value={value} />
        ))}
        <div className="copy-fields">
          {fields.map((entry, index) => (
            <div className="copy-field" key={entry.id}>
              <label className="field">
                <span>
                  {index + 1}.{" "}
                  {entry.text.length > 100
                    ? entry.text.slice(0, 100) + "…"
                    : entry.text}
                </span>
                <textarea
                  aria-label={entry.text}
                  value={drafts[entry.id] ?? values[entry.id] ?? entry.text}
                  maxLength={5000}
                  rows={entry.text.length > 130 ? 4 : 2}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [entry.id]: event.target.value,
                    }))
                  }
                />
              </label>
              <button
                type="button"
                className="copy-reset"
                onClick={() =>
                  setDrafts((current) => ({
                    ...current,
                    [entry.id]: entry.text,
                  }))
                }
              >
                Use original text
              </button>
            </div>
          ))}
          {!fields.length && (
            <p className="muted">
              No text matches your search in this section.
            </p>
          )}
        </div>
        <div className="copy-save-note">
          Changes apply throughout the site after saving. Text from other
          sections stays in your draft when you switch sections.
        </div>
      </ActionForm>
    </section>
  );
}
