import { test, expect, type Page } from "@playwright/test";

async function signIn(page: Page, name: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await expect(page).toHaveURL(name === "Sibel" ? /\/admin$/ : /\/account$/);
}

test("events are public to see, members join and leave, full events cannot be joined", async ({
  page,
  browser,
}) => {
  // Visitors see events and can download the calendar file, but joining needs an account.
  const visitor = await browser.newContext();
  const guest = await visitor.newPage();
  await guest.goto("/events");
  await expect(
    guest.getByRole("heading", { name: "Women’s Spring Brunch" }),
  ).toBeVisible();
  await guest.goto("/event/event-brunch");
  await guest
    .getByRole("complementary", { name: "Event details" })
    .getByRole("link", { name: "Join", exact: true })
    .click();
  await expect(guest).toHaveURL(/\/login\?next=\/event\/event-brunch/);
  const ics = await visitor.request.get(
    "http://127.0.0.1:3000/api/calendar/event/event-brunch",
  );
  expect(ics.status()).toBe(200);
  const file = await ics.text();
  expect(file).toContain("SUMMARY:Women’s Spring Brunch");
  expect(file).toContain("The Garden Room");
  // A draft event is not public, and a premium post's audio is not open to visitors.
  expect(
    (
      await visitor.request.get(
        "http://127.0.0.1:3000/api/calendar/event/event-draft",
      )
    ).status(),
  ).toBe(404);
  expect(
    (
      await visitor.request.get("http://127.0.0.1:3000/api/audio/post-p6")
    ).status(),
  ).toBe(403);
  await visitor.close();

  // A member leaves and rejoins, so the seat count is the same afterwards.
  await signIn(page, "Amelia");
  await page.goto("/event/event-brunch");
  await expect(page.getByText("You are going")).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Leave", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Join", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Join", exact: true }).click();
  await expect(page.getByText("You are going")).toBeVisible();
  // The workshop has three seats and three people, so it is full.
  await page.goto("/event/event-workshop");
  await expect(
    page.getByRole("button", { name: "No seats left" }),
  ).toBeDisabled();
});

test("consultation requests wait for approval, then the admin approves them", async ({
  page,
  browser,
}) => {
  await signIn(page, "Layla");
  await page.goto("/account?tab=book");
  await page
    .getByRole("button", { name: /^Choose / })
    .first()
    .click();
  await page.getByRole("radio").first().check();
  const topic = `Approval flow ${Date.now()}`;
  await page.getByLabel("What would you like to talk about?").fill(topic);
  await page
    .getByRole("button", { name: "Request consultation", exact: true })
    .click();
  await expect(page.getByText(topic, { exact: true })).toBeVisible();
  await expect(page.getByText("awaiting approval").first()).toBeVisible();

  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  admin.on("dialog", (dialog) => dialog.accept());
  await signIn(admin, "Sibel");
  await admin.goto("/admin/consults");
  const row = admin.locator("tr").filter({ hasText: topic });
  await expect(row.getByText("pending", { exact: true })).toBeVisible();
  await expect(row.getByRole("button", { name: "Approve" })).toBeVisible();
  await row.getByRole("button", { name: "Approve" }).click();
  await expect(row.getByText("confirmed", { exact: true })).toBeVisible();
  // Cancel it again so the member's monthly allowance stays free for other tests.
  await row.getByRole("button", { name: "Cancel" }).click();
  await expect(row.getByText("cancelled", { exact: true })).toBeVisible();
  await adminContext.close();
});

test("a company books once through its private link, and the link then stops working", async ({
  page,
  browser,
}) => {
  await signIn(page, "Sibel");
  await page.goto("/admin/consults");
  await page
    .getByRole("button", { name: "Create company link", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Create company link" });
  const label = `Test Co ${Date.now()}`;
  await dialog.getByLabel("Company or note (optional)").fill(label);
  await dialog.getByRole("button", { name: "Create link" }).click();
  const row = page.locator("tr").filter({ hasText: label });
  await expect(row.getByText("active", { exact: true })).toBeVisible();
  const token = (await row.innerHTML()).match(
    /\/company\/([A-Za-z0-9]{24,})/,
  )?.[1];
  expect(token, "the new link shows its address").toBeTruthy();

  const companyContext = await browser.newContext();
  const company = await companyContext.newPage();
  await company.goto(`/company/${token}`);
  await expect(
    company.getByRole("heading", { name: "Book your consultation with Sibel" }),
  ).toBeVisible();
  await company
    .getByRole("button", { name: /^Choose / })
    .first()
    .click();
  await company.getByRole("radio").first().check();
  // The form keeps what was typed when something is invalid.
  await company.getByLabel("Company name").fill("Northlight Studio");
  await company.getByLabel("Contact person").fill("Rae Morgan");
  await company.getByLabel("Email").fill("rae@northlight");
  await company.getByLabel("Phone").fill("+1 512 555 0199");
  await company
    .getByLabel("What would you like to discuss?")
    .fill("Leadership coaching for our team leads");
  await company.getByRole("button", { name: "Confirm booking" }).click();
  await expect(company.getByRole("status")).toContainText("valid email");
  await expect(company.getByLabel("Company name")).toHaveValue(
    "Northlight Studio",
  );
  await company.getByLabel("Email").fill("rae@northlight.example");
  await company.getByRole("button", { name: "Confirm booking" }).click();
  await expect(
    company.getByRole("heading", { name: "Your consultation is booked" }),
  ).toBeVisible();

  // One booking per link.
  await company.goto(`/company/${token}`);
  await expect(
    company.getByRole("heading", { name: "This link has already been used" }),
  ).toBeVisible();
  await companyContext.close();

  await page.goto("/admin/consults");
  await expect(
    page.locator("tr").filter({ hasText: "Northlight Studio" }).first(),
  ).toBeVisible();
  await expect(
    page.locator("tr").filter({ hasText: label }).getByText("used", {
      exact: true,
    }),
  ).toBeVisible();
});

test("members choose which emails they get, and announcements respect it", async ({
  page,
  browser,
}) => {
  await signIn(page, "Amelia");
  await page.goto("/account?tab=emails");
  await expect(
    page.getByRole("heading", { name: "Email preferences" }),
  ).toBeVisible();
  await page.getByLabel("Announcements").uncheck();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("status")).toContainText("saved");

  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await signIn(admin, "Sibel");
  await admin.goto("/admin/announce?to=m0");
  await expect(admin.getByText(/will not get this email/i)).toBeVisible();
  await adminContext.close();

  // Put the preference back for the other tests.
  await page.reload();
  await page.getByLabel("Announcements").check();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("status")).toContainText("saved");
});
