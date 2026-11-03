"use client";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Notify } from "./toast";
import { askConfirm } from "./confirm-dialog";
import { useMutation } from "./block-editor";
import { SiteSelect } from "./site-select";

export type BulkMember = {
  id: string;
  name: string;
  email: string;
  status: string;
  hasStripe: boolean;
};
type Selection = {
  selected: string[];
  toggle: (id: string, range: boolean) => void;
  setVisible: (on: boolean) => void;
  allVisible: boolean | "some";
};
const Ctx = createContext<Selection | null>(null);
const useSelection = () => {
  const value = useContext(Ctx);
  if (!value) throw new Error("Bulk selection is not available here.");
  return value;
};

/** Keeps the chosen members for the table below; only rows that are shown can stay selected. */
export function BulkProvider({
  members,
  quotaLeft,
  live,
  children,
}: {
  members: BulkMember[];
  quotaLeft: number;
  live: boolean;
  children: React.ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const last = useRef<string | undefined>(undefined);
  const [selected, setSelected] = useState<string[]>([]);
  const [shown, setShown] = useState<string[]>([]);
  const readShown = () =>
    [
      ...(root.current?.querySelectorAll<HTMLInputElement>(
        "tbody tr:not([hidden]) input[data-bulk-id]",
      ) ?? []),
    ].map((input) => input.dataset.bulkId!);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const update = () => {
      const ids = readShown();
      setShown((previous) => (previous.join() === ids.join() ? previous : ids));
      // Searching or filtering hides rows; they drop out of the selection.
      setSelected((previous) => {
        const kept = previous.filter((id) => ids.includes(id));
        return kept.length === previous.length ? previous : kept;
      });
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(element, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["hidden"],
    });
    return () => observer.disconnect();
  }, []);
  const count = shown.filter((id) => selected.includes(id)).length;
  const value: Selection = {
    selected,
    allVisible:
      !shown.length || !count ? false : count === shown.length ? true : "some",
    setVisible: (on) => setSelected(on ? shown : []),
    toggle: (id, range) => {
      setSelected((previous) => {
        const on = !previous.includes(id);
        let ids = [id];
        if (range && last.current && shown.includes(last.current)) {
          const a = shown.indexOf(last.current),
            b = shown.indexOf(id);
          ids = shown.slice(Math.min(a, b), Math.max(a, b) + 1);
        }
        last.current = id;
        return on
          ? [...new Set([...previous, ...ids])]
          : previous.filter((x) => !ids.includes(x));
      });
    },
  };
  return (
    <Ctx.Provider value={value}>
      <div ref={root}>
        <BulkToolbar members={members} quotaLeft={quotaLeft} live={live} />
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function BulkCheckbox({ id, name }: { id: string; name: string }) {
  const { selected, toggle } = useSelection();
  return (
    <input
      type="checkbox"
      data-bulk-id={id}
      aria-label={`Select ${name}`}
      checked={selected.includes(id)}
      onChange={() => {}}
      onClick={(event) => toggle(id, event.shiftKey)}
    />
  );
}
export function BulkHeaderCheckbox() {
  const { allVisible, setVisible } = useSelection();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = allVisible === "some";
  }, [allVisible]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label="Select all members shown"
      checked={allVisible === true}
      onChange={(event) => setVisible(event.target.checked)}
    />
  );
}

function BulkToolbar({
  members,
  quotaLeft,
  live,
}: {
  members: BulkMember[];
  quotaLeft: number;
  live: boolean;
}) {
  const { selected, setVisible } = useSelection();
  const mutation = useMutation();
  const [editing, setEditing] = useState(false);
  const chosen = members.filter((m) => selected.includes(m.id));
  const n = chosen.length;
  const noun = (count: number) => `${count} member${count === 1 ? "" : "s"}`;
  const ids = JSON.stringify(chosen.map((m) => m.id));
  const run = async (fields: Record<string, string>) => {
    const result = await mutation.run({ entity: "members", ids, ...fields });
    if (result.ok) setVisible(false);
    return result;
  };
  const remove = async () => {
    const withStripe = chosen.filter((m) => m.hasStripe).length;
    if (
      !(await askConfirm(
        `Their accounts, bookings and meeting access are removed. This cannot be undone.${withStripe ? ` ${withStripe} of them ${withStripe === 1 ? "has" : "have"} a Stripe record: subscriptions are not cancelled automatically, so cancel them in Stripe first.` : ""}`,
        {
          title: `Delete ${noun(n)}?`,
          confirmLabel: `Yes, delete ${n}`,
        },
      ))
    )
      return;
    await run({ op: "bulkDelete" });
  };
  const sendLinks = async () => {
    const active = chosen.filter((m) => m.status === "active").length;
    const skipped = n - active;
    if (!active) {
      mutation.setFeedback({
        ok: false,
        message: "None of the selected members is active, so no link was sent.",
      });
      return;
    }
    let partial = false;
    if (active > quotaLeft) {
      if (quotaLeft <= 0) {
        mutation.setFeedback({
          ok: false,
          message: "Today’s email limit is used up. Try again tomorrow.",
        });
        return;
      }
      if (
        !(await askConfirm(
          `Only ${quotaLeft} of today’s emails are left, but ${active} members would get one. Send ${quotaLeft} now and leave the rest for tomorrow?`,
          {
            title: "Not enough emails left today",
            confirmLabel: `Send ${quotaLeft}`,
            danger: false,
          },
        ))
      )
        return;
      partial = true;
    } else if (
      !(await askConfirm(
        `Each member gets an email with a one-use link.${skipped ? ` ${skipped} not active, so they are skipped.` : ""} It counts towards today’s limit (${quotaLeft} left).`,
        {
          title: `Send a password link to ${noun(active)}?`,
          confirmLabel: "Yes, send",
          danger: false,
        },
      ))
    )
      return;
    await run({ op: "bulkLink", ...(partial ? { partial: "yes" } : {}) });
  };
  return (
    <div aria-live="polite">
      {n ? (
        <div
          role="toolbar"
          aria-label="Actions for the selected members"
          className="bulk-toolbar"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            padding: "10px 4px",
          }}
        >
          <b style={{ marginRight: 8 }}>{n} selected</b>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            disabled={mutation.pending}
            onClick={remove}
          >
            Delete
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            disabled={mutation.pending}
            onClick={() => setEditing(true)}
          >
            Bulk edit
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            disabled={mutation.pending || !live}
            title={live ? undefined : "Available on the live site"}
            onClick={sendLinks}
          >
            Send password link
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => setVisible(false)}
          >
            Clear selection
          </button>
        </div>
      ) : null}
      {editing && n ? (
        <BulkEditDialog
          title={`Edit ${noun(n)}`}
          applyLabel={`Apply to ${noun(n)}`}
          pending={mutation.pending}
          onClose={() => setEditing(false)}
          onApply={async (fields) => {
            const result = await run({ op: "bulkEdit", ...fields });
            if (result.ok) setEditing(false);
          }}
        />
      ) : null}
      <Notify result={mutation.feedback} />
    </div>
  );
}

/** Same look as the other admin dialogs (admin-dialog.tsx), so the fields and buttons line up. */
function BulkEditDialog({
  title,
  applyLabel,
  pending,
  onClose,
  onApply,
}: {
  title: string;
  applyLabel: string;
  pending: boolean;
  onClose: () => void;
  onApply: (fields: Record<string, string>) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="admin-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}
    >
      <div className="admin-dialog-body">
        <button
          type="button"
          className="admin-dialog-close"
          aria-label="Close editor"
          onClick={() => dialog.current?.close()}
        >
          ×
        </button>
        <h3 id={titleId}>{title}</h3>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const fields: Record<string, string> = {};
            for (const [key, value] of new FormData(event.currentTarget))
              fields[key] = String(value);
            onApply(fields);
          }}
        >
          <p className="hint">
            Only the things you fill in change; everything else stays as it is.
          </p>
          <div className="row">
            <SiteSelect
              name="tier"
              label="Membership"
              defaultValue=""
              options={[
                { value: "", label: "Don’t change" },
                { value: "free", label: "Free" },
                { value: "premium", label: "Premium" },
              ]}
            />
            <SiteSelect
              name="status"
              label="Status"
              defaultValue=""
              options={[
                { value: "", label: "Don’t change" },
                { value: "active", label: "Active" },
                { value: "paused", label: "Paused" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
          </div>
          <label className="field">
            Premium access ends (UTC)
            <input name="premiumUntil" type="datetime-local" />
          </label>
          <div className="field">
            <label className="checkbox-field">
              <input name="clearPremiumUntil" type="checkbox" />
              Remove the end date
            </label>
          </div>
          <label className="field">
            Add to the private note
            <textarea name="note" rows={3} maxLength={2000} />
          </label>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => dialog.current?.close()}
            >
              Cancel
            </button>
            <span className="form-actions-gap" />
            <button className="btn" disabled={pending}>
              {pending ? "Saving…" : applyLabel}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
