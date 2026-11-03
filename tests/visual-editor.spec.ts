import { expect, test, type Page } from "@playwright/test";

async function openEditor(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /Sibel/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/content");
  await page.getByRole("tab", { name: "Visual editor", exact: true }).click();
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
    await page.getByRole("tab", { name: "Visual editor", exact: true }).click();
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
    await page.getByRole("tab", { name: "Visual editor", exact: true }).click();
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
    await page.getByRole("tab", { name: "Visual editor", exact: true }).click();
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
