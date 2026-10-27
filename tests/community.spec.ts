import { test, expect, type Page } from "@playwright/test";
async function login(page: Page, name: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await expect(page).toHaveURL(name === "Sibel" ? /\/admin$/ : /\/account$/);
}
const privateParagraph = "Repeat for a week and watch the pattern appear.";

test("public routes render, images load and premium bodies stay on the server", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of [
    "/",
    "/about",
    "/morning-coffee",
    "/solutions",
    "/blog",
    "/podcast",
    "/contact",
    "/login",
    "/join?plan=free",
    "/post/p1",
  ]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    if (route === "/")
      await page.screenshot({
        path: "test-results/home-desktop.png",
        fullPage: true,
      });
  }
  const locked = await request.get("/post/p6");
  const html = await locked.text();
  expect(html).toContain("Premium members only");
  expect(html).not.toContain(privateParagraph);
  const draft = await (await request.get("/post/p9")).text();
  expect(draft).toContain("Page not found");
  expect(draft).not.toContain("Stress Management for Busy Seasons");
  expect((await request.get("/api/audio/pc0")).status()).toBe(403);
  expect((await request.get("/api/calendar/session/s4")).status()).toBe(403);
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/admin/posts");
  await expect(page).toHaveURL(/\/login$/);
  const forged = await request.get("/admin", {
    headers: { Cookie: "mcc-development-session=admin.9999999999999.forged" },
  });
  const forgedHtml = await forged.text();
  expect(
    forged.url().endsWith("/login") || forgedHtml.includes("NEXT_REDIRECT"),
  ).toBeTruthy();
  expect(forgedHtml).not.toContain("Sample monthly revenue");
  for (const image of [
    "hero2-1-2.webp",
    "sibel-about-1.webp",
    "womens-e1767706912925.webp",
  ])
    expect((await request.get(`/images/${image}`)).ok()).toBeTruthy();
  expect(errors).toEqual([]);
});

test("free members can read their posts but cannot fetch meetings or admin data", async ({
  page,
}) => {
  await login(page, "Amelia");
  await expect(
    page.getByText("The Zoom link is available to Premium members."),
  ).toBeVisible();
  const account = await (await page.request.get("/account")).text();
  expect(account).not.toContain("example.invalid/zoom/");
  await page.goto("/post/p3");
  await expect(
    page.getByText(privateParagraph, { exact: false }),
  ).toBeVisible();
  const premium = await page.request.get("/post/p6");
  expect(await premium.text()).not.toContain(privateParagraph);
  expect((await page.request.get("/api/calendar/session/s4")).status()).toBe(
    403,
  );
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/account$/);
});

test("premium calendars and booking allowance work, then cancellation frees the slot", async ({
  page,
}) => {
  await login(page, "Layla");
  await expect(
    page.getByText("This week’s meeting:", { exact: false }),
  ).toBeVisible();
  const calendar = await page.request.get("/api/calendar/session/s4");
  expect(calendar.status()).toBe(200);
  expect(calendar.headers()["content-type"]).toContain("text/calendar");
  const ics = await calendar.text();
  expect(ics).toContain("BEGIN:VEVENT");
  expect(ics).toContain("/meetings/session/s4");
  expect(ics).not.toContain("Passcode:");
  expect(ics).not.toContain("example.invalid/zoom/");
  expect((await page.request.get("/api/calendar/booking/b1")).status()).toBe(
    404,
  );
  await page.goto("/account?tab=book");
  const chosenDay = page.getByRole("button", { name: /^Choose / }).first();
  const bookedMonth = (await chosenDay.getAttribute("aria-label"))!
    .split(",")[1]
    .trim()
    .split(" ")[0];
  await chosenDay.click();
  await page.getByRole("radio").first().check();
  const topic = `Planning my next chapter ${Date.now()}`;
  await page.getByLabel("What would you like to talk about?").fill(topic);
  await page
    .getByRole("button", { name: "Confirm booking", exact: true })
    .click();
  await expect(page.getByText(topic, { exact: true })).toBeVisible();
  // No further dates in the same month should be offered after using that month's allowance.
  await expect(
    page.getByRole("button", {
      name: new RegExp(`^Choose .*?, ${bookedMonth} `),
    }),
  ).toHaveCount(0);
  const booking = page
    .locator(".list-item")
    .filter({ has: page.getByText(topic, { exact: true }) });
  await booking
    .getByRole("button", { name: "Cancel booking", exact: true })
    .click();
  await expect(booking.getByText("cancelled", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Choose / }).first(),
  ).toBeVisible();
});

test("admin can publish gated content, upload protected audio and edit site copy", async ({
  page,
  browser,
}) => {
  await login(page, "Sibel");
  for (const route of [
    "members",
    "posts",
    "sessions",
    "podcast",
    "consults",
    "announce",
    "content",
  ]) {
    await page.goto(`/admin/${route}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
  await page.goto("/admin/posts");
  await page
    .getByRole("button", { name: "+ New blog post", exact: true })
    .click();
  const editor = page.getByRole("dialog", {
    name: "+ New blog post",
    exact: true,
  });
  const title = `Review post ${Date.now()}`;
  await editor.getByLabel("Title", { exact: true }).fill(title);
  await editor.getByLabel("Short excerpt").fill("A short public introduction.");
  await editor
    .getByLabel("Post (separate paragraphs with a blank line)")
    .fill("Protected review text should never reach visitors.");
  await editor
    .getByRole("combobox", { name: "Who can read this post?" })
    .click();
  await editor
    .getByRole("option", { name: "Premium members", exact: true })
    .click();
  await editor.getByRole("combobox", { name: "Status", exact: true }).click();
  await editor.getByRole("option", { name: "published", exact: true }).click();
  await editor.getByRole("button", { name: "Save changes" }).click();
  await expect(editor).not.toBeVisible();
  await page.goto("/blog?access=premium");
  await page.getByRole("heading", { name: title }).click();
  const postUrl = page.url();
  const visitor = await browser.newContext();
  const html = await (await visitor.request.get(postUrl)).text();
  expect(html).not.toContain(
    "Protected review text should never reach visitors.",
  );
  await page.goto("/admin/podcast");
  await page
    .getByRole("button", { name: "+ New episode", exact: true })
    .click();
  const episode = page.getByRole("dialog", {
    name: "+ New episode",
    exact: true,
  });
  const episodeTitle = `Review audio upload ${Date.now()}`;
  await episode.getByLabel("Title", { exact: true }).fill(episodeTitle);
  await episode
    .getByLabel("Description")
    .fill("A small audio fixture for access verification.");
  await episode.getByRole("combobox", { name: "Status", exact: true }).click();
  await episode.getByRole("option", { name: "published", exact: true }).click();
  const wav = Buffer.alloc(44 + 16000);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(16000, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(16000, 40);
  await episode
    .getByLabel("Audio file (MP3, M4A, WAV or OGG)")
    .setInputFiles({ name: "review.wav", mimeType: "audio/wav", buffer: wav });
  await episode.getByRole("button", { name: "Save changes" }).click();
  await expect(episode).not.toBeVisible();
  await page.goto("/podcast");
  const audio = page
    .locator(".ep")
    .filter({
      has: page.getByRole("heading", { name: episodeTitle, exact: true }),
    })
    .locator("audio");
  const audioPath = (await audio.getAttribute("src"))!;
  expect((await page.request.get(audioPath)).status()).toBe(200);
  expect(
    (
      await page.request.get(audioPath, { headers: { Range: "bytes=0-43" } })
    ).status(),
  ).toBe(206);
  expect(
    (await visitor.request.get(`http://127.0.0.1:3000${audioPath}`)).status(),
  ).toBe(403);
  await page.goto("/account?tab=podcast");
  await expect(
    page.getByRole("navigation", { name: "Member area" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Member area" })
      .getByRole("link", { name: "Podcast", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page
      .locator(".account-content .ep")
      .filter({
        has: page.getByRole("heading", { name: episodeTitle, exact: true }),
      })
      .locator("audio"),
  ).toHaveAttribute("src", audioPath);
  await visitor.close();
  await page.goto("/admin/content");
  const original = await page
    .getByLabel("Headline", { exact: true })
    .inputValue();
  await page
    .getByLabel("Headline", { exact: true })
    .fill("A thoughtful next chapter starts here.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toContainText("Changes saved");
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "A thoughtful next chapter starts here.",
  );
  await page.goto("/admin/content");
  await page.getByLabel("Headline", { exact: true }).fill(original);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toContainText("Changes saved");
});

test("mobile menu works and public pages stay inside the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(
    page.getByRole("button", { name: "Close menu" }),
  ).toHaveAttribute("aria-expanded", "true");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Meet Sibel" })
    .click();
  await expect(page).toHaveURL(/\/about$/);
  for (const route of [
    "/",
    "/about",
    "/morning-coffee",
    "/solutions",
    "/blog",
    "/podcast",
  ]) {
    await page.goto(route);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
  }
});
