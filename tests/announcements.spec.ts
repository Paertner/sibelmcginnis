import { test, expect, type Page } from "@playwright/test";

async function signIn(page: Page, name: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await expect(page).toHaveURL(name === "Sibel" ? /\/admin$/ : /\/account$/);
}

test("individual announcements are private, sanitized, personalized and include an embedded email image", async ({
  page,
  browser,
}) => {
  await signIn(page, "Sibel");
  await page.goto("/admin/announce");
  await expect(
    page.getByRole("button", { name: "Publish & prepare email", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("combobox", { name: "Add registered members" })
    .fill("outside@example.net");
  await expect(
    page.getByText(
      "No registered member found. External addresses cannot be added.",
    ),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Add registered members" })
    .fill("Amelia");
  await page.getByRole("option", { name: /Amelia Hart/ }).click();
  await expect(
    page.getByRole("button", { name: "Remove Amelia Hart" }),
  ).toBeVisible();
  await expect(
    page.getByText("1 unique recipient", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^A personal note/ }).click();
  const subject = `Private coaching note ${Date.now()}`;
  await page.getByLabel("Subject", { exact: true }).fill(subject);
  await page.getByRole("button", { name: /^Image/ }).click();
  await page
    .getByRole("button", { name: "Choose an image", exact: true })
    .click();
  const picker = page.getByRole("dialog", { name: "Choose an image" });
  await picker.getByRole("tab", { name: "Upload files" }).click();
  await picker
    .locator('input[type="file"]')
    .setInputFiles("public/images/womens-e1767706912925.webp");
  await expect(picker.locator(".media-picker-selection")).toHaveText(
    "womens-e1767706912925.webp",
  );
  await picker.getByLabel("Image description").fill("Session image");
  await picker.getByRole("button", { name: "Use this image" }).click();
  await page.getByRole("button", { name: "HTML code", exact: true }).click();
  const code = await page.getByLabel("Message HTML code").inputValue();
  expect(code.split(/\r?\n/).length).toBeGreaterThan(20);
  const imageTag = code.match(/<img[^>]+>/)![0];
  await page
    .getByLabel("Message HTML code")
    .fill(
      `<table style="background-color:#ededed"><tr><td>${imageTag}<h1>Hello {{first_name}}</h1><p>Only your next chapter.</p><a href="javascript:alert(1)">Unsafe link</a><img src="x" onerror="alert(1)"><script>alert("unsafe-content")</script><p>{{account_url}}</p></td></tr></table>`,
    );
  await page
    .getByRole("button", { name: "Preview email", exact: true })
    .click();
  await expect(page.getByTitle("Email preview")).toBeVisible();
  const editedHtml = await page.getByLabel("Message HTML code").inputValue();
  await page
    .getByLabel("Message HTML code")
    .fill("<p>Join https://zoom.us/j/123456789</p>");
  await page
    .getByRole("button", { name: "Publish & prepare email", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Use a protected session page link",
  );
  await page.getByLabel("Message HTML code").fill(editedHtml);
  await page
    .getByRole("button", { name: "Publish & prepare email", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Published to 1 member and prepared 1 individual email",
  );
  const history = page
    .locator("details")
    .filter({ has: page.getByText(subject, { exact: true }) });
  await history.locator("summary").click();
  const draftUrl = await history
    .getByRole("link", { name: "Download email draft" })
    .getAttribute("href");
  const draft = await page.request.get(draftUrl!);
  expect(draft.status()).toBe(200);
  const eml = await draft.text();
  expect(eml).toContain("To: amelia.hart@example.com");
  expect(eml).toContain("Content-ID: <media-0>");
  const htmlPart = eml
    .split(
      'Content-Type: text/html; charset="UTF-8"\r\nContent-Transfer-Encoding: base64\r\n\r\n',
    )[1]
    .split("\r\n--mcc-")[0];
  const rendered = Buffer.from(
    htmlPart.replace(/\r\n/g, ""),
    "base64",
  ).toString("utf8");
  expect(rendered).toContain("Hello Amelia");
  expect(rendered).toContain('src="cid:media-0"');
  expect(rendered).not.toContain("javascript:");
  expect(rendered).not.toContain("onerror");
  expect(rendered).not.toContain("<script");
  const targetContext = await browser.newContext();
  const target = await targetContext.newPage();
  await signIn(target, "Amelia");
  await expect(
    target.getByRole("heading", { name: subject, exact: true }),
  ).toBeVisible();
  const memberMessage = target.locator(".card").filter({
    has: target.getByRole("heading", { name: subject, exact: true }),
  });
  await expect(
    memberMessage.getByRole("heading", { name: "Hello Amelia", exact: true }),
  ).toBeVisible();
  const memberHtml = await (await target.request.get("/account")).text();
  expect(memberHtml).not.toContain("alert(1)");
  const imageUrl = await memberMessage
    .getByRole("img", { name: "Session image", exact: true })
    .getAttribute("src");
  expect((await target.request.get(imageUrl!)).status()).toBe(200);
  expect((await target.request.get(draftUrl!)).status()).toBe(403);
  const otherContext = await browser.newContext();
  const other = await otherContext.newPage();
  await signIn(other, "Layla");
  await expect(
    other.getByRole("heading", { name: subject, exact: true }),
  ).toHaveCount(0);
  expect((await other.request.get(imageUrl!)).status()).toBe(404);
  expect(await (await other.request.get("/account")).text()).not.toContain(
    "Only your next chapter.",
  );
  await targetContext.close();
  await otherContext.close();
});

test("member groups and individual recipients are deduplicated", async ({
  page,
}) => {
  await signIn(page, "Sibel");
  await page.goto("/admin/announce");
  await page.getByRole("button", { name: "@free", exact: true }).click();
  const initial = await page.locator(".recipient-count").textContent();
  await page
    .getByRole("combobox", { name: "Add registered members" })
    .fill("Amelia");
  await page
    .getByRole("combobox", { name: "Add registered members" })
    .press("Enter");
  await expect(page.locator(".recipient-count")).toHaveText(initial!);
  await page.getByRole("button", { name: "Remove Amelia Hart" }).click();
  await expect(page.locator(".recipient-count")).toHaveText(initial!);
  await expect(
    page.getByRole("button", { name: "@free", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const subject = `Free community note ${Date.now()}`;
  await page.getByLabel("Subject", { exact: true }).fill(subject);
  await page
    .getByRole("button", { name: "Publish & prepare email", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    `Published to ${initial!.split(" ")[0]} members`,
  );
});

test("calendar invitations contain protected entry links and saved links deny expired members", async ({
  page,
  browser,
}) => {
  await signIn(page, "Layla");
  const account = await (await page.request.get("/account")).text();
  expect(account).not.toContain("example.invalid/zoom/");
  expect(account).not.toContain("Passcode:");
  const calendar = await (
    await page.request.get("/api/calendar/session/s4")
  ).text();
  expect(calendar).toContain("/meetings/session/s4");
  expect(calendar).not.toContain("Passcode:");
  expect(calendar).not.toContain("example.invalid/zoom/");
  await page.goto("/meetings/session/s4");
  await expect(
    page.getByText("Your Premium access is active.", { exact: true }),
  ).toBeVisible();
  const copiedUrl = page.url();
  const adminContext = await browser.newContext(),
    admin = await adminContext.newPage();
  await signIn(admin, "Sibel");
  await admin.goto("/admin/members");
  await admin
    .getByRole("button", { name: "Layla Demir, edit member", exact: true })
    .click();
  const editor = admin.getByRole("dialog", {
    name: "Edit Layla Demir",
    exact: true,
  });
  const original = await editor
    .getByLabel("Premium access ends (UTC)")
    .inputValue();
  await editor.getByLabel("Premium access ends (UTC)").fill("2020-01-01T10:30");
  await editor
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await expect(editor).not.toBeVisible();
  await page.goto(copiedUrl);
  await expect(
    page.getByRole("heading", {
      name: "An active Premium membership is required",
    }),
  ).toBeVisible();
  expect((await page.request.get("/api/calendar/session/s4")).status()).toBe(
    403,
  );
  expect((await page.request.get("/api/audio/pc0")).status()).toBe(403);
  await admin
    .getByRole("button", { name: "Layla Demir, edit member", exact: true })
    .click();
  await editor.getByLabel("Premium access ends (UTC)").fill(original);
  await editor
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await expect(editor).not.toBeVisible();
  await page.goto(copiedUrl);
  await expect(
    page.getByText("Your Premium access is active.", { exact: true }),
  ).toBeVisible();
  await adminContext.close();
});

test("announcement composer remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, "Sibel");
  await page.goto("/admin/announce");
  await expect(
    page.getByRole("combobox", { name: "Add registered members" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/announcement-mobile.png",
    fullPage: true,
  });
});

test("emails are built from blocks, saved as reusable templates and share a common footer", async ({
  page,
}) => {
  await signIn(page, "Sibel");
  await page.goto("/admin/announce");
  await page.getByRole("button", { name: /^Heading/ }).click();
  await page.getByLabel("Heading", { exact: true }).fill("Plans for November");
  const name = `November note ${Date.now()}`;
  await page.getByRole("button", { name: "Save as template" }).click();
  const save = page.getByRole("dialog", { name: "Save as template" });
  await save.getByLabel("Template name").fill(name);
  await save.getByRole("button", { name: "Save template" }).click();
  await expect(page.getByText(`Saved as “${name}”.`)).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: new RegExp(`^${name}`) }).click();
  await expect(page.getByLabel("Heading", { exact: true })).toHaveValue(
    "Plans for November",
  );
  await page.getByRole("button", { name: "Edit footer" }).click();
  let footer = page.getByRole("dialog", { name: "Common email footer" });
  await footer
    .getByRole("textbox", { name: "Small print" })
    .fill("Thank you for being here.");
  await footer.getByRole("button", { name: "Save footer" }).click();
  await expect(page.locator(".email-footer-preview")).toContainText(
    "Thank you for being here.",
  );
  await page.getByRole("button", { name: "Edit footer" }).click();
  footer = page.getByRole("dialog", { name: "Common email footer" });
  page.once("dialog", (dialog) => dialog.accept());
  await footer.getByRole("button", { name: "Simple", exact: true }).click();
  await footer.getByRole("button", { name: "Save footer" }).click();
  await expect(page.locator(".email-footer-preview")).toContainText(
    "A little space to connect",
  );
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: `Delete template ${name}` }).click();
  await expect(page.getByText("Template deleted.")).toBeVisible();
});
