import { useState } from "react";
import { ActionForm } from "./action-form";
import { AdminCancel, AdminDialog } from "./admin-dialog";
import { EntityFields } from "./admin-forms";
import { adminMutation } from "@/lib/actions";
import { fmtDate, today } from "@/lib/dates";
import { linkStatus, LINK_DAYS } from "@/lib/company-links";
import { companyUrl } from "@/lib/site-url";
import type { Booking, CompanyLink } from "@/lib/store";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-sm btn-ghost"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copy this link:", value);
        }
      }}
    >
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}

const statusColor = { active: "ok", used: "grey", expired: "warn", revoked: "bad" };

/** Admin list of company booking links: create, copy, extend, revoke and see who booked. */
export function CompanyLinks({
  links,
  bookings,
}: {
  links: CompanyLink[];
  bookings: Booking[];
}) {
  const rows = links.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <section className="panel company-links" aria-labelledby="company-links-title">
      <header className="card-head">
        <div>
          <h2 id="company-links-title">Company links</h2>
          <p className="card-sub">
            A private link lets one company book one consultation without an
            account. It works for {LINK_DAYS} days and you can extend it.
          </p>
        </div>
        <AdminDialog title="Create company link" trigger="+ Create link" primary>
          <ActionForm
            action={adminMutation}
            submitLabel="Create link"
            actions={<AdminCancel />}
          >
            <EntityFields entity="companyLinks" />
            <input type="hidden" name="op" value="create" />
            <label className="field">
              Company or note (optional)
              <input name="label" maxLength={80} placeholder="For example: Willow & Co" />
            </label>
            <p className="hint">
              The link is valid for {LINK_DAYS} days and allows one booking.
            </p>
          </ActionForm>
        </AdminDialog>
      </header>
      <div className="tcell">
        <table>
          <thead>
            <tr>
              <th>Company or note</th>
              <th>Link</th>
              <th>Status</th>
              <th>Expires</th>
              <th>Booking</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((link) => {
              const status = linkStatus(link),
                url = companyUrl(link.token),
                booking = bookings.find((b) => b.id === link.bookingId);
              return (
                <tr key={link.id} className={status === "active" ? "" : "is-past"}>
                  <td>
                    <b>{link.label || "No label"}</b>
                    <small className="block-small">
                      Created {fmtDate(link.createdAt, { month: "short", day: "numeric" })}
                    </small>
                  </td>
                  <td>
                    <code className="company-url">{url}</code>
                    <div>
                      <CopyButton value={url} />
                    </div>
                  </td>
                  <td>
                    <span className={`badge b-${statusColor[status]}`}>{status}</span>
                  </td>
                  <td className="nowrap">
                    {fmtDate(link.expiresAt, { month: "short", day: "numeric", year: "numeric" })}
                    {status === "expired" ? (
                      <small className="block-small">
                        {Math.round(
                          (Date.parse(today()) - Date.parse(link.expiresAt)) / 86400000,
                        )}{" "}
                        days ago
                      </small>
                    ) : null}
                  </td>
                  <td>
                    {booking ? (
                      <div className="company-cell">
                        <b>
                          {fmtDate(booking.date, { weekday: "short", month: "short", day: "numeric" })}{" "}
                          · {booking.time}
                        </b>
                        <small>
                          {booking.company} · {booking.contact}
                        </small>
                        <small>
                          {booking.email} · {booking.phone}
                        </small>
                        <small>{booking.topic}</small>
                      </div>
                    ) : (
                      <span className="muted">Not booked</span>
                    )}
                  </td>
                  <td className="admin-row-actions">
                    {status === "active" || status === "expired" ? (
                      <ActionForm
                        action={adminMutation}
                        submitLabel={`Extend +${LINK_DAYS} days`}
                        confirmMessage={`Extend this link by ${LINK_DAYS} days?`}
                      >
                        <EntityFields entity="companyLinks" id={link.id} />
                        <input type="hidden" name="op" value="extend" />
                      </ActionForm>
                    ) : null}
                    {status === "active" || status === "expired" ? (
                      <ActionForm
                        action={adminMutation}
                        submitLabel="Revoke"
                        confirmMessage="Are you sure? The company will no longer be able to use this link."
                      >
                        <EntityFields entity="companyLinks" id={link.id} />
                        <input type="hidden" name="op" value="revoke" />
                      </ActionForm>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={6} className="muted">
                  No company links yet. Create one with + Create link.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
