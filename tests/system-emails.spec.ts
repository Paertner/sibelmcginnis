import { test, expect } from "@playwright/test";
import {
  buildSystemEmail,
  findSystemEmail,
  htmlToText,
  missingFields,
  resolveSystemEmail,
} from "../src/lib/system-emails";

const context = {
  origin: "https://site.test",
  settings: { siteTitle: "Our Site" },
};

test("default password emails fill in the name, site and link, in HTML and plain text", () => {
  const template = resolveSystemEmail("set-password");
  const mail = buildSystemEmail(
    template,
    undefined,
    {
      name: "Jane <b>Doe</b>",
      email: "jane@example.test",
      link: "https://site.test/reset-password?token_hash=abc",
    },
    context,
  );
  expect(mail.subject).toBe("Set your password for Our Site");
  expect(mail.html).toContain(
    'href="https://site.test/reset-password?token_hash=abc"',
  );
  expect(mail.html).toContain("Hello Jane,");
  expect(mail.html).not.toContain("{{");
  expect(mail.text).toContain("Hello Jane,");
  expect(mail.text).toContain(
    "Set my password (https://site.test/reset-password?token_hash=abc)",
  );
  expect(mail.text).not.toMatch(/<[a-z]/);
});

test("a saved template wins over the default, and the footer is added only when asked", () => {
  const saved = {
    "reset-password": {
      subject: "Hi {{first_name}}, new password",
      blocks: [{ id: "a", type: "text" as const, html: "Open {{link}} now" }],
      footer: false,
      updatedAt: "2026-01-01",
    },
  };
  const template = resolveSystemEmail("reset-password", saved);
  expect(template.saved).toBe(true);
  const footer = [{ id: "f", type: "note" as const, html: "FOOTER-MARK" }];
  const without = buildSystemEmail(
    template,
    footer,
    { name: "Amy Z", link: "L1" },
    context,
  );
  expect(without.subject).toBe("Hi Amy, new password");
  expect(without.html).not.toContain("FOOTER-MARK");
  const withFooter = buildSystemEmail(
    { ...template, footer: true },
    footer,
    { name: "Amy Z", link: "L1" },
    context,
  );
  expect(withFooter.html).toContain("FOOTER-MARK");
  expect(resolveSystemEmail("set-password", saved).saved).toBe(false);
});

test("the link field is required in both password emails", () => {
  for (const key of ["set-password", "reset-password"]) {
    expect(findSystemEmail(key)?.required).toContain("link");
    expect(
      missingFields(key, "Hello", [
        { id: "x", type: "text", html: "No link here" },
      ]),
    ).toEqual(["link"]);
    expect(
      missingFields(key, "Hello", [
        { id: "x", type: "button", label: "Go", href: "{{link}}" },
      ]),
    ).toEqual([]);
  }
});

test("plain text keeps links and line breaks", () => {
  expect(
    htmlToText(
      '<p>Hi &amp; welcome</p><p><a href="https://x.test">Open</a><br>Bye</p>',
    ),
  ).toBe("Hi & welcome\nOpen (https://x.test)\nBye");
});
