import { expect, test, type Page } from "@playwright/test";

async function openEditor(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /Sibel/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/content");
  return page.frameLocator("iframe.ve-frame");
}
const toast = (page: Page) => page.locator(".toast").last();

test("a text is edited in the page preview, saved, shown on the site and reset", async ({
  page,
}) => {
  const frame = await openEditor(page);
  const heading = frame.locator("[data-ve]", {
    hasText: "Ways to grow with Sibel",
  });
  await expect(heading).toBeVisible();
  const unique = `Ways to grow ${Date.now()}`;
  try {
    await heading.click();
    await page.keyboard.press("Control+A");
    await page.keyboard.type(unique);
    await expect(page.locator(".ve-count")).toContainText("1 unsaved change");
    await page.getByRole("button", { name: "Save and publish" }).click();
    await expect(toast(page)).toHaveText("Site text saved.");
    await page.goto("/");
    await expect(page.getByRole("heading", { name: unique })).toBeVisible();
  } finally {
    await page.goto("/admin/content");
    const edited = page
      .frameLocator("iframe.ve-frame")
      .locator("[data-ve]", { hasText: unique });
    await page
      .frameLocator("iframe.ve-frame")
      .locator("[data-ve]")
      .first()
      .waitFor();
    if (await edited.count()) {
      await edited.click();
      await page.getByRole("button", { name: "Use original text" }).click();
      await page.getByRole("button", { name: "Save and publish" }).click();
      await expect(toast(page)).toHaveText("Site text saved.");
    }
  }
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Ways to grow with Sibel" }),
  ).toBeVisible();
});

test("the search title of a page is saved and used by the public page", async ({
  page,
}) => {
  await openEditor(page);
  await page.locator(".ve-page select").selectOption({ label: "Meet Sibel" });
  const title = page.getByLabel("Search title");
  const original = await title.inputValue();
  const unique = `About Sibel ${Date.now()}`;
  try {
    await title.fill(unique);
    await page.getByRole("button", { name: "Save and publish" }).click();
    await expect(toast(page)).toHaveText("Site text saved.");
    await page.goto("/about");
    await expect(page).toHaveTitle(unique);
  } finally {
    await page.goto("/admin/content");
    await page.locator(".ve-page select").selectOption({ label: "Meet Sibel" });
    await page.getByLabel("Search title").fill(original);
    await page.getByRole("button", { name: "Save and publish" }).click();
    await expect(toast(page)).toHaveText("Site text saved.");
  }
  await page.goto("/about");
  await expect(page).toHaveTitle(original);
});

test("clicking a picture in the preview opens the image picker", async ({
  page,
}) => {
  const frame = await openEditor(page);
  await frame.locator('[data-site-image="home.hero"]').first().click();
  const picker = page.getByRole("dialog", { name: "Choose an image" });
  await expect(picker).toBeVisible();
  await expect(picker).toContainText("Hero portrait");
  await page.keyboard.press("Escape");
  await expect(picker).not.toBeVisible();
});

test("the home headline from Settings is edited in the preview too", async ({
  page,
}) => {
  const frame = await openEditor(page);
  const headline = frame.locator(".hero-copy h1[data-ve]");
  await expect(headline).toBeVisible();
  const original = (await headline.textContent())!.trim();
  const stamp = `${Date.now()}`;
  try {
    await headline.click();
    await page.keyboard.press("Control+End");
    await page.keyboard.type(` ${stamp}`);
    await page.getByRole("button", { name: "Save and publish" }).click();
    await expect(toast(page)).toHaveText(/saved/i);
    await page.goto("/");
    await expect(page.locator("h1").first()).toContainText(stamp);
  } finally {
    await page.goto("/admin/content");
    const edited = page
      .frameLocator("iframe.ve-frame")
      .locator(".hero-copy h1[data-ve]");
    await edited.waitFor();
    await edited.click();
    await page.keyboard.press("Control+A");
    await page.keyboard.type(original);
    await page.getByRole("button", { name: "Save and publish" }).click();
    await expect(toast(page)).toHaveText(/saved/i);
  }
  await page.goto("/");
  await expect(page.locator("h1").first()).toHaveText(original);
});

test("the Premium price is changed in Settings under Payments", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Sibel/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/settings");
  await page.getByRole("tab", { name: "Payments", exact: true }).click();
  const price = page.getByLabel("Premium price ($ / month)");
  const original = await price.inputValue();
  try {
    await price.fill("27");
    await page.getByRole("button", { name: "Save membership" }).click();
    await expect(toast(page)).toBeVisible();
    await page.goto("/morning-coffee");
    await expect(page.getByText("$27", { exact: false }).first()).toBeVisible();
  } finally {
    await page.goto("/admin/settings");
    await page.getByRole("tab", { name: "Payments", exact: true }).click();
    await page.getByLabel("Premium price ($ / month)").fill(original);
    await page.getByRole("button", { name: "Save membership" }).click();
    await expect(toast(page)).toBeVisible();
  }
});

test("a button label, a sentence beside a link and a password hint are edited in the preview", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Sibel/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const stamp = `${Date.now()}`;
  const open = async () => {
    await page.goto("/admin/content");
    await page.locator(".ve-page select").selectOption({ label: "Join" });
    const frame = page.frameLocator("iframe.ve-frame");
    return {
      button: frame.locator("[data-ve]", { hasText: /^Create free account/ }),
      member: frame.locator("[data-ve]", { hasText: /^Already a member\?/ }),
      hint: frame.locator("[data-ve]", {
        hasText: /^Type the same password again/,
      }),
    };
  };
  const items = await open();
  try {
    for (const [item, text] of [
      [items.button, `Create account ${stamp}`],
      [items.member, `Member already? ${stamp}`],
      [items.hint, `Repeat it ${stamp}`],
    ] as const) {
      await item.click();
      await page.keyboard.press("Control+A");
      await page.keyboard.type(text);
    }
    await expect(page.locator(".ve-count")).toContainText("3 unsaved changes");
    await page.getByRole("button", { name: "Save and publish" }).click();
    await expect(toast(page)).toHaveText("Site text saved.");
    await page.goto("/join");
    await expect(
      page.getByRole("button", { name: `Create account ${stamp}` }),
    ).toBeVisible();
    await expect(page.getByText(`Member already? ${stamp}`)).toBeVisible();
    await expect(page.getByText(`Repeat it ${stamp}`)).toBeVisible();
  } finally {
    await open();
    const frame = page.frameLocator("iframe.ve-frame");
    await frame.locator("[data-ve]").first().waitFor();
    for (const text of [
      `Create account ${stamp}`,
      `Member already? ${stamp}`,
      `Repeat it ${stamp}`,
    ]) {
      const item = frame.locator("[data-ve]", { hasText: text });
      if (await item.count()) {
        await item.click();
        await page.getByRole("button", { name: "Use original text" }).click();
      }
    }
    await page.getByRole("button", { name: "Save and publish" }).click();
    await expect(toast(page)).toHaveText("Site text saved.");
  }
  await page.goto("/join");
  await expect(
    page.getByRole("button", { name: "Create free account" }),
  ).toBeVisible();
});

test("answers inside folded questions and the strip captions are editable", async ({
  page,
}) => {
  const frame = await openEditor(page);
  await expect(frame.locator("details[open]").first()).toBeAttached();
  await expect(
    frame.locator("[data-ve]", { hasText: /^weekly live sessions$/ }),
  ).toBeVisible();
  await expect(
    frame.locator("[data-ve]", { hasText: /^join from anywhere$/ }),
  ).toBeVisible();
  await expect(
    frame.locator("[data-ve]", {
      hasText: /^Premium members get post-meeting/,
    }),
  ).toBeVisible();
});
