import { siteText } from "@/lib/site-copy";
import { SiteSelect } from "@/components/site-select";
import { ActionForm } from "@/components/action-form";
import { contact } from "@/lib/actions";
export const metadata = { title: "Contact" };
export default function Contact() {
  return (
    <>
      <div className="page-hero">
        <div className="wrap">
          <p className="eyebrow">{siteText("contact.contact")}</p>
          <h1>{siteText("contact.let-s-start-a-conversation")}</h1>
          <p>
            {siteText(
              "contact.questions-about-membership-coaching-or-corporate-training-write-t",
            )}
          </p>
        </div>
      </div>
      <section className="block">
        <div className="wrap narrow">
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
              <label className="field">
                {siteText("contact.message")}
                <textarea name="message" required maxLength={20000} />
              </label>
              <p className="hint">
                {siteText(
                  "contact.email-delivery-is-being-prepared-this-form-currently-validates-me",
                )}
              </p>
            </ActionForm>
          </div>
        </div>
      </section>
    </>
  );
}
