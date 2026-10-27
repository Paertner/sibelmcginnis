import { test, expect, type Page } from "@playwright/test";
import seed from "../src/lib/seed.json";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jWl8AAAAASUVORK5CYII=",
  "base64",
);
async function openEditor(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /Sibel/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/content");
  await page.getByRole("tab", { name: "Page images", exact: true }).click();
}
async function chooseGroup(page: Page, group: string) {
  await page.getByRole("combobox", { name: "Page or image section" }).click();
  await page.getByRole("option", { name: group, exact: true }).click();
}
const card = (page: Page, label: string) =>
  page
    .locator(".page-image-card")
    .filter({ has: page.getByRole("heading", { name: label, exact: true }) });
test("page image uploads update the public hero, preserve descriptions and restore originals", async ({
  page,
  browser,
}) => {
  await openEditor(page);
  const hero = card(page, "Hero portrait");
  await hero
    .getByLabel("Upload replacement")
    .setInputFiles({
      name: "hero-review.png",
      mimeType: "image/png",
      buffer: png,
    });
  await hero.getByLabel("Image description").fill("A new community portrait");
  await hero.getByRole("combobox", { name: "Image focus" }).click();
  await hero.getByRole("option", { name: "Top", exact: true }).click();
  await hero.getByRole("button", { name: "Save image", exact: true }).click();
  await expect(hero.getByRole("status")).toHaveText("Page image saved.");
  await page.goto("/");
  await expect(page.locator("#heroPhoto")).toHaveAttribute(
    "aria-label",
    "A new community portrait",
  );
  const style = await page.locator("#heroPhoto").getAttribute("style");
  const imagePath = style!.match(/\/api\/site-image\/[^"')]+/)![0];
  const visitor = await browser.newContext();
  const response = await visitor.request.get(
    `http://127.0.0.1:3000${imagePath}`,
  );
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");
  expect(await response.body()).toEqual(png);
  await page.reload();
  await expect(page.locator("#heroPhoto")).toHaveAttribute(
    "aria-label",
    "A new community portrait",
  );
  await page.goto("/admin/content");
  await page.getByRole("tab", { name: "Page images", exact: true }).click();
  await hero
    .getByRole("button", { name: "Restore default", exact: true })
    .click();
  await expect(hero.getByRole("status")).toHaveText("Original image restored.");
  expect(
    (await visitor.request.get(`http://127.0.0.1:3000${imagePath}`)).status(),
  ).toBe(404);
  await page.goto("/");
  await expect(page.locator("#heroPhoto")).toHaveAttribute(
    "style",
    /\/images\/sibel-about-1.webp/,
  );
  await visitor.close();
});
test("individual post covers update both article and library without changing other page portraits", async ({
  page,
}) => {
  await openEditor(page);
  await chooseGroup(page, "Blog posts");
  const post = seed.posts.find(
    (post) => post.status === "published" && post.access === "public",
  )!;
  const editor = card(page, post.title);
  await editor
    .getByLabel("Upload replacement")
    .setInputFiles({
      name: "post-review.png",
      mimeType: "image/png",
      buffer: png,
    });
  await editor.getByLabel("Image description").fill("A reflection journal");
  await editor.getByRole("button", { name: "Save image", exact: true }).click();
  await expect(editor.getByRole("status")).toHaveText("Page image saved.");
  await page.goto(`/post/${post.id}`);
  const src = await page.locator(".article-cover").getAttribute("src");
  expect(src).toMatch(/^\/api\/site-image\//);
  await expect(page.locator(".article-cover")).toHaveAttribute(
    "alt",
    "A reflection journal",
  );
  await page.goto("/blog");
  await expect(
    page
      .locator(".post-card")
      .filter({
        has: page.getByRole("heading", { name: post.title, exact: true }),
      })
      .locator("img"),
  ).toHaveAttribute("src", src!);
  await page.goto("/about");
  await expect(page.locator(".photo")).not.toHaveAttribute(
    "src",
    /\/api\/site-image\//,
  );
  await page.goto("/admin/content");
  await page.getByRole("tab", { name: "Page images", exact: true }).click();
  await chooseGroup(page, "Blog posts");
  await editor
    .getByRole("button", { name: "Restore default", exact: true })
    .click();
  await expect(editor.getByRole("status")).toHaveText(
    "Original image restored.",
  );
});
test("invalid images are rejected and image controls fit mobile screens", async ({
  page,
}) => {
  await openEditor(page);
  const hero = card(page, "Hero portrait");
  await hero
    .getByLabel("Upload replacement")
    .setInputFiles({
      name: "invalid.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from("<svg></svg>"),
    });
  await expect(hero.getByRole("alert")).toContainText("JPG, PNG or WebP");
  await hero
    .getByLabel("Upload replacement")
    .setInputFiles({
      name: "invalid.png",
      mimeType: "image/png",
      buffer: Buffer.from("not an image"),
    });
  await hero.getByRole("button", { name: "Save image", exact: true }).click();
  await expect(hero.getByRole("status")).toHaveText(
    "The image file does not match its format.",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await chooseGroup(page, "Contact");
  await expect(
    page.getByRole("heading", {
      name: "No page-specific images here",
      exact: true,
    }),
  ).toBeVisible();
});
