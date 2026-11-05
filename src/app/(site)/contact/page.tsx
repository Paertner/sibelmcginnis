import { siteText } from "@/lib/site-copy";
import { pageMetadata } from "@/lib/page-meta";
import { SiteSelect } from "@/components/site-select";
import { ActionForm } from "@/components/action-form";
import { contact } from "@/lib/actions";
import { DateTimePicker } from "@/components/datetime-picker";
import { usesDatabase } from "@/lib/store";
export const generateMetadata = () =>
  pageMetadata("contact", { title: "Contact" });
export default function Contact() {
  return (
    <section className="block">
      <div className="wrap">
        <div className="cf-side">
          <aside className="cf-panel">
            <p className="eyebrow">{siteText("contact.contact")}</p>
            <h1>{siteText("contact.let-s-start-a-conversation")}</h1>
            <p>
              {siteText(
                "contact.questions-about-membership-coaching-or-corporate-training-write-t",
              )}
            </p>
          </aside>
          <div className="card">
            <ActionForm
              action={contact}
              submitLabel={siteText("contact.send-message")}
            >
              <div className="row">
                <label className="field">
                  {siteText("contact.name")}
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    maxLength={120}
                  />
                </label>
                <label className="field">
                  {siteText("contact.email")}
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </label>
              </div>
              <SiteSelect
                name="interest"
                label={siteText("contact.i-m-interested-in")}
                options={[
                  siteText("contact.option-membership"),
                  siteText("contact.option-coaching"),
                  siteText("contact.option-corporate"),
                  siteText("contact.option-other"),
                ].map((value) => ({ value, label: value }))}
              />
              <DateTimePicker
                name="preferredTime"
                label={siteText("contact.preferred-time")}
                hint={siteText("contact.preferred-time-hint")}
              />
              <label className="field">
                {siteText("contact.message")}
                <textarea name="message" required maxLength={20000} />
              </label>
              {/* A field people never see; bots that fill it in are ignored. */}
              <div className="cf-trap" aria-hidden="true">
                <label>
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              {usesDatabase() ? null : (
                <p className="hint">
                  {siteText(
                    "contact.email-delivery-is-being-prepared-this-form-currently-validates-me",
                  )}
                </p>
              )}
            </ActionForm>
          </div>
        </div>
      </div>
    </section>
  );
}
