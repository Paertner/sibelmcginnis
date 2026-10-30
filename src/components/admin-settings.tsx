"use client";
import { useState } from "react";
import { adminMutation } from "@/lib/actions";
import type { MediaItem, SiteImage } from "@/lib/site-images";
import type { Integrations, SiteSettings } from "@/lib/store";
import type { EmailQuota } from "@/lib/email-quota";
import { ActionForm } from "./action-form";
import { Icon } from "./admin-icons";
import { MediaPicker } from "./media-library";
import { SiteSelect } from "./site-select";
import { weekdays } from "@/lib/weekday";

const tabs = [
  ["general", "General"],
  ["weekly", "Weekly session"],
  ["payments", "Payments"],
  ["integrations", "Integrations"],
] as const;
const shortDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

function Text({
  name,
  label,
  value,
  type = "text",
  placeholder,
  required = false,
  hint,
}: {
  name: string;
  label: string;
  value?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="field">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      {hint ? <small className="setting-hint">{hint}</small> : null}
    </label>
  );
}

function General({
  settings,
  logo,
  media,
}: {
  settings: SiteSettings;
  logo: SiteImage;
  media: MediaItem[];
}) {
  const [picking, setPicking] = useState<"logo" | "favicon">();
  const [favicon, setFavicon] = useState(settings.faviconPath ?? "");
  const [saved, setSaved] = useState("");
  const faviconSrc =
    media.find((item) => item.path === favicon)?.src ??
    (favicon || "/images/brand-cup.svg");
  return (
    <>
      <section className="panel settings-brand">
        <h3>Brand</h3>
        <div className="brand-assets">
          <div className="brand-asset">
            <span className="brand-asset-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo.src} alt="" />
            </span>
            <div>
              <b>Logo</b>
              <small>Shown in the header on every page.</small>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setPicking("logo")}
              >
                <Icon name="image" size={15} /> Change logo
              </button>
            </div>
          </div>
          <div className="brand-asset">
            <span className="brand-asset-preview small">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={faviconSrc} alt="" />
            </span>
            <div>
              <b>Favicon</b>
              <small>
                The small icon in the browser tab. Square images work best.
              </small>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setPicking("favicon")}
              >
                <Icon name="image" size={15} /> Change favicon
              </button>
            </div>
          </div>
        </div>
        {saved ? (
          <p className="form-feedback success" role="status">
            {saved}
          </p>
        ) : null}
      </section>
      <ActionForm
        action={adminMutation}
        className="panel settings-form"
        submitLabel="Save site settings"
      >
        <input type="hidden" name="entity" value="siteSettings" />
        <input type="hidden" name="faviconPath" value={favicon} />
        <h3>Site details</h3>
        <div className="row">
          <Text
            name="siteTitle"
            label="Site title"
            value={settings.siteTitle ?? "Sibel McGinnis"}
            required
            hint="Shown beside the logo and in the browser tab."
          />
          <Text
            name="tagline"
            label="Tagline"
            value={settings.tagline}
            placeholder="Morning Coffee Community"
          />
        </div>
        <div className="row">
          <Text
            name="contactEmail"
            label="Contact email"
            type="email"
            value={settings.contactEmail}
            placeholder="hello@sibelmcginnis.com"
          />
          <Text
            name="mailingAddress"
            label="Mailing address"
            value={settings.mailingAddress}
            hint="US law requires it in marketing emails; it appears in the email footer."
          />
        </div>
        <h3 className="settings-sub">Social media</h3>
        <div className="row">
          <Text
            name="facebook"
            label="Facebook"
            value={settings.facebook}
            placeholder="https://facebook.com/…"
          />
          <Text
            name="instagram"
            label="Instagram"
            value={settings.instagram}
            placeholder="https://instagram.com/…"
          />
          <Text
            name="linkedin"
            label="LinkedIn"
            value={settings.linkedin}
            placeholder="https://linkedin.com/in/…"
          />
        </div>
        {favicon !== (settings.faviconPath ?? "") ? (
          <p className="hint">New favicon chosen. Save to apply it.</p>
        ) : null}
      </ActionForm>
      {picking === "logo" ? (
        <MediaPicker
          slot={logo}
          media={media}
          onClose={() => setPicking(undefined)}
          onSaved={() => setSaved("Logo updated.")}
        />
      ) : null}
      {picking === "favicon" ? (
        <MediaPicker
          slot={{
            ...logo,
            id: "favicon",
            group: "Settings",
            label: "Favicon",
            src: faviconSrc,
            mediaId: media.find((item) => item.path === favicon)?.id ?? "",
          }}
          media={media}
          framing={false}
          onClose={() => setPicking(undefined)}
          onChoose={({ media: item }) => setFavicon(item.path)}
        />
      ) : null}
    </>
  );
}

export type WeeklySettings = {
  weekday: number;
  time: string;
  minutes: number;
  autoZoom: boolean;
};

function Weekly({ weekly }: { weekly: WeeklySettings }) {
  return (
    <ActionForm
      action={adminMutation}
      className="panel settings-form"
      submitLabel="Save weekly session"
    >
      <input type="hidden" name="entity" value="weekly" />
      <input type="hidden" name="id" value="" />
      <h3>Weekly session</h3>
      <p className="muted">
        The day your live circle meets. Dates, labels and wording across the
        site follow it. Existing sessions keep their dates.
      </p>
      <div className="row">
        <SiteSelect
          name="meetingWeekday"
          label="Day of the week"
          defaultValue={String(weekly.weekday)}
          options={weekdays.map((day, i) => ({ value: String(i), label: day }))}
        />
        <Text
          name="meetingTime"
          label="Start time (Eastern Time, e.g. 1:00 PM)"
          value={weekly.time}
          required
        />
        <Text
          name="meetingMinutes"
          label="Length (minutes)"
          type="number"
          value={String(weekly.minutes)}
          required
        />
      </div>
      <label className="checkbox-field">
        <input
          type="checkbox"
          name="autoZoom"
          defaultChecked={weekly.autoZoom}
        />{" "}
        Create a Zoom link automatically when I add a session
      </label>
    </ActionForm>
  );
}

function Payments({
  stripe,
  live,
  webhookUrl,
}: {
  stripe: Integrations["stripe"];
  live: boolean;
  webhookUrl: string;
}) {
  return (
    <section className="panel settings-stripe">
      <div className="stripe-head">
        <span className="stripe-mark" aria-hidden="true">
          S
        </span>
        <div>
          <h3>Stripe</h3>
          <p className="muted">
            Takes Premium payments ($20/month), manages subscriptions and sends
            receipts.
          </p>
        </div>
        <span className={`badge ${stripe?.connected ? "b-ok" : "b-grey"}`}>
          {stripe?.connected
            ? `Connected · ${stripe.mode === "live" ? "live" : "test"} mode`
            : "Not connected"}
        </span>
      </div>
      {stripe?.connected ? (
        <>
          <dl className="settings-facts">
            <div>
              <dt>Account</dt>
              <dd>{stripe.accountName}</dd>
            </div>
            <div>
              <dt>Account ID</dt>
              <dd>
                <code>{stripe.accountId}</code>
              </dd>
            </div>
            <div>
              <dt>Connected</dt>
              <dd>{shortDate(stripe.connectedAt)}</dd>
            </div>
            {live ? (
              <div>
                <dt>Webhook</dt>
                <dd>
                  {stripe.webhookSaved
                    ? "Signing secret saved"
                    : "Not set up yet"}
                </dd>
              </div>
            ) : null}
          </dl>
          {live ? (
            <WebhookForm
              webhookUrl={webhookUrl}
              saved={!!stripe.webhookSaved}
            />
          ) : null}
          <div className="settings-actions">
            <a
              className="btn btn-ghost"
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Stripe dashboard ↗
            </a>
            <ActionForm
              action={adminMutation}
              submitLabel="Disconnect"
              confirmMessage="Disconnect Stripe? Members can’t start or renew Premium until it is connected again."
            >
              <input type="hidden" name="entity" value="integrations" />
              <input type="hidden" name="op" value="stripe-disconnect" />
            </ActionForm>
          </div>
        </>
      ) : live ? (
        <>
          <ol className="stripe-steps">
            <li>
              In Stripe, open Developers → API keys and copy the{" "}
              <b>Secret key</b>.
            </li>
            <li>Paste it below and press Connect. It is stored encrypted.</li>
            <li>Then add the webhook (shown after connecting).</li>
          </ol>
          <ActionForm
            action={adminMutation}
            className="settings-form"
            submitLabel="Connect to Stripe"
          >
            <input type="hidden" name="entity" value="integrations" />
            <input type="hidden" name="op" value="stripe-connect" />
            <Secret
              name="secretKey"
              label="Secret key"
              placeholder="sk_live_… or sk_test_…"
            />
          </ActionForm>
        </>
      ) : (
        <>
          <ol className="stripe-steps">
            <li>Choose Connect to Stripe.</li>
            <li>Sign in to your Stripe account, or create one.</li>
            <li>Approve the connection and you are sent back here.</li>
          </ol>
          <ActionForm
            action={adminMutation}
            className="settings-connect"
            submitLabel="Connect to Stripe"
          >
            <input type="hidden" name="entity" value="integrations" />
            <input type="hidden" name="op" value="stripe-connect" />
          </ActionForm>
          <p className="setting-hint">
            Prototype: connecting is simulated with a test account. On the live
            site this opens Stripe’s secure sign-in.
          </p>
        </>
      )}
    </section>
  );
}

function WebhookForm({
  webhookUrl,
  saved,
}: {
  webhookUrl: string;
  saved: boolean;
}) {
  return (
    <div className="settings-webhook">
      <h4>Webhook</h4>
      <p className="muted">
        Stripe tells the site when a payment succeeds or a subscription ends. In
        Stripe go to Developers → Webhooks → Add endpoint, use this address and
        select the events <code>customer.subscription.created</code>,{" "}
        <code>customer.subscription.updated</code>,{" "}
        <code>customer.subscription.deleted</code> and{" "}
        <code>checkout.session.completed</code>:
      </p>
      <p>
        <code>{webhookUrl}</code>
      </p>
      <ActionForm
        action={adminMutation}
        className="settings-form"
        submitLabel="Save webhook secret"
      >
        <input type="hidden" name="entity" value="integrations" />
        <input type="hidden" name="op" value="stripe-connect" />
        <Text
          name="webhookSecret"
          label="Signing secret"
          type="password"
          placeholder={
            saved ? "Saved. Paste a new one to replace it." : "whsec_…"
          }
        />
      </ActionForm>
    </div>
  );
}

function Secret({
  name,
  label,
  tail,
  placeholder,
}: {
  name: string;
  label: string;
  tail?: string;
  placeholder: string;
}) {
  return (
    <Text
      name={name}
      label={label}
      type="password"
      placeholder={
        tail ? `Saved: ••••${tail}. Leave blank to keep it.` : placeholder
      }
    />
  );
}

function IntegrationsTab({
  integrations,
  quota,
  live,
}: {
  integrations: Integrations;
  quota: EmailQuota;
  live: boolean;
}) {
  const zoom = integrations.zoom,
    resend = integrations.resend;
  return (
    <>
      <p className="settings-warning">
        {live
          ? "Keys you enter here are stored encrypted and checked before they are saved. Leave a key blank to keep the saved one."
          : "This prototype keeps only the last four characters of any key you enter. Add real keys only on the live site."}
      </p>
      <ActionForm
        action={adminMutation}
        className="panel settings-form"
        submitLabel="Save Zoom details"
      >
        <input type="hidden" name="entity" value="integrations" />
        <input type="hidden" name="op" value="zoom" />
        <div className="integration-head">
          <span className="integration-mark zoom" aria-hidden="true">
            <Icon name="video" size={18} />
          </span>
          <div>
            <h3>Zoom</h3>
            <p className="muted">
              Creates a meeting for every weekly session and consultation. Uses
              a Zoom Server-to-Server OAuth app.
            </p>
          </div>
          <span className={`badge ${zoom?.clientId ? "b-ok" : "b-grey"}`}>
            {zoom?.clientId ? `Saved ${shortDate(zoom.savedAt)}` : "Not set up"}
          </span>
        </div>
        <div className="row">
          <Text name="accountId" label="Account ID" value={zoom?.accountId} />
          <Text name="clientId" label="Client ID" value={zoom?.clientId} />
          <Secret
            name="clientSecret"
            label="Client secret"
            tail={zoom?.secretTail}
            placeholder="Paste the client secret"
          />
        </div>
      </ActionForm>
      <ActionForm
        action={adminMutation}
        className="panel settings-form"
        submitLabel="Save email settings"
      >
        <input type="hidden" name="entity" value="integrations" />
        <input type="hidden" name="op" value="resend" />
        <div className="integration-head">
          <span className="integration-mark resend" aria-hidden="true">
            <Icon name="mail" size={18} />
          </span>
          <div>
            <h3>Email delivery (Resend)</h3>
            <p className="muted">
              Sends announcements, booking confirmations and reminders.
            </p>
          </div>
          <span className={`badge ${resend?.keyTail ? "b-ok" : "b-grey"}`}>
            {resend?.keyTail
              ? `Saved ${shortDate(resend.savedAt)}`
              : "Not set up"}
          </span>
        </div>
        <div className="row">
          <Secret
            name="apiKey"
            label="API key"
            tail={resend?.keyTail}
            placeholder="re_…"
          />
          <Text
            name="fromName"
            label="Sender name"
            value={resend?.fromName ?? "Sibel McGinnis"}
          />
          <Text
            name="fromEmail"
            label="Sender email"
            type="email"
            value={resend?.fromEmail}
            placeholder="hello@sibelmcginnis.com"
          />
        </div>
        <div className="row">
          <Text
            name="dailyLimit"
            label="Daily email limit"
            type="number"
            value={String(quota.limit)}
            required
            hint="100 on Resend’s free plan. Raise it after upgrading the plan."
          />
          <div className="field quota-summary">
            Sent today
            <b>
              {quota.sent} of {quota.limit}
            </b>
            <small className="setting-hint">
              {quota.left} left. Counts every email the site sends; resets at
              midnight UTC.
            </small>
          </div>
        </div>
      </ActionForm>
    </>
  );
}

export function AdminSettings({
  settings,
  integrations,
  logo,
  media,
  quota,
  live,
  webhookUrl,
  weekly,
}: {
  weekly: WeeklySettings;
  /** Real keys are saved (encrypted) instead of only their last four characters. */
  live: boolean;
  webhookUrl: string;
  quota: EmailQuota;
  settings: SiteSettings;
  integrations: Integrations;
  logo: SiteImage;
  media: MediaItem[];
}) {
  const [tab, setTab] = useState<(typeof tabs)[number][0]>("general");
  return (
    <div className="settings">
      <div className="segmented" role="tablist" aria-label="Settings">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "general" ? (
        <General settings={settings} logo={logo} media={media} />
      ) : tab === "weekly" ? (
        <Weekly weekly={weekly} />
      ) : tab === "payments" ? (
        <Payments
          stripe={integrations.stripe}
          live={live}
          webhookUrl={webhookUrl}
        />
      ) : (
        <IntegrationsTab
          integrations={integrations}
          quota={quota}
          live={live}
        />
      )}
    </div>
  );
}
