import { test, expect, type Page } from "@playwright/test";
import seed from "../src/lib/seed.json";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jWl8AAAAASUVORK5CYII=",
  "base64",
);
async function openMedia(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /Sibel/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/media");
}
async function chooseGroup(page: Page, group: string) {
  await page
    .getByRole("group", { name: "Page" })
    .getByRole("button", { name: new RegExp(`^${group}`) })
    .click();
}
const placement = (page: Page, label: string) =>
  page
    .locator(".placement")
    .filter({ has: page.getByRole("heading", { name: label, exact: true }) });
const pageStatus = (page: Page) =>
  page.locator(".media-library > .form-feedback");
// Opens the picker for a placement and uploads a file through its Upload files tab.
async function uploadInPicker(
  page: Page,
  label: string,
  file: { name: string; mimeType: string; buffer: Buffer },
) {
  await placement(page, label)
    .getByRole("button", { name: "Change image", exact: true })
    .click();
  const picker = page.getByRole("dialog", { name: "Choose an image" });
  await picker.getByRole("tab", { name: "Upload files" }).click();
  await picker.locator('input[type="file"]').setInputFiles(file);
  return picker;
}
test("choosing an uploaded image updates the public hero, keeps descriptions and restores originals", async ({
  page,
  browser,
}) => {
  await openMedia(page);
  const picker = await uploadInPicker(page, "Hero portrait", {
    name: "hero-review.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(picker.getByRole("status")).toHaveText(
    "1 image added to the library.",
  );
  await expect(picker.locator(".media-picker-selection")).toHaveText(
    "hero-review.png",
  );
  await picker.getByLabel("Image description").fill("A new community portrait");
  await picker.getByRole("combobox", { name: "Image focus" }).click();
  await page.getByRole("option", { name: "Top", exact: true }).click();
  await picker.getByRole("button", { name: "Use this image" }).click();
  await expect(pageStatus(page)).toHaveText("Hero portrait: image updated.");
  await expect(
    placement(page, "Hero portrait").getByText("Replaced", { exact: true }),
  ).toBeVisible();
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
  await page.goto("/admin/media");
  await placement(page, "Hero portrait")
    .getByRole("button", { name: "Restore original", exact: true })
    .click();
  await expect(pageStatus(page)).toHaveText("Original image restored.");
  // The file stays in the library for admins but is no longer public.
  expect(
    (await visitor.request.get(`http://127.0.0.1:3000${imagePath}`)).status(),
  ).toBe(404);
  expect((await page.request.get(imagePath)).status()).toBe(200);
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
  await openMedia(page);
  await chooseGroup(page, "Blog posts");
  const post = seed.posts.find(
    (post) => post.status === "published" && post.access === "public",
  )!;
  const picker = await uploadInPicker(page, post.title, {
    name: "post-review.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(picker.getByRole("status")).toHaveText(
    "1 image added to the library.",
  );
  await picker.getByLabel("Image description").fill("A reflection journal");
  await picker.getByRole("button", { name: "Use this image" }).click();
  await expect(pageStatus(page)).toHaveText(`${post.title}: image updated.`);
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
  await page.goto("/admin/media");
  await chooseGroup(page, "Blog posts");
  await placement(page, post.title)
    .getByRole("button", { name: "Restore original", exact: true })
    .click();
  await expect(pageStatus(page)).toHaveText("Original image restored.");
});
test("a library image can be reused, and deleting it restores the original", async ({
  page,
}) => {
  await openMedia(page);
  await page.getByRole("tab", { name: /^Library/ }).click();
  await page.locator(".upload-btn input").setInputFiles({
    name: "library-review.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(pageStatus(page)).toHaveText("1 image added to the library.");
  const details = page.locator(".library-side");
  await expect(details.locator(".media-file-name")).toHaveText(
    "library-review.png",
  );
  await expect(details).toContainText("Not used on any page yet.");
  await page.getByRole("tab", { name: "Page images" }).click();
  await placement(page, "Programs · The Podcast")
    .getByRole("button", { name: "Change image", exact: true })
    .click();
  const picker = page.getByRole("dialog", { name: "Choose an image" });
  await picker.getByRole("button", { name: "library-review.png" }).click();
  await picker.getByRole("button", { name: "Use this image" }).click();
  await expect(pageStatus(page)).toHaveText(
    "Programs · The Podcast: image updated.",
  );
  await page.getByRole("tab", { name: /^Library/ }).click();
  await page.getByRole("button", { name: "library-review.png" }).click();
  await expect(details).toContainText("Homepage · Programs · The Podcast");
  page.once("dialog", (dialog) => dialog.accept());
  await details.getByRole("button", { name: "Delete permanently" }).click();
  await expect(pageStatus(page)).toHaveText(
    "Image deleted. 1 placement went back to the original image.",
  );
  await page.getByRole("tab", { name: "Page images" }).click();
  await expect(
    placement(page, "Programs · The Podcast").getByText("Original", {
      exact: true,
    }),
  ).toBeVisible();
});
test("invalid images are rejected and the admin fits mobile screens", async ({
  page,
}) => {
  await openMedia(page);
  let picker = await uploadInPicker(page, "Hero portrait", {
    name: "invalid.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg></svg>"),
  });
  await expect(picker.getByRole("status")).toHaveText(
    "invalid.svg: choose a JPG, PNG or WebP image up to 3 MB.",
  );
  await picker.getByRole("button", { name: "Cancel" }).click();
  picker = await uploadInPicker(page, "Hero portrait", {
    name: "invalid.png",
    mimeType: "image/png",
    buffer: Buffer.from("not an image"),
  });
  await expect(picker.getByRole("status")).toHaveText(
    "invalid.png: the file does not match its format.",
  );
  await picker.getByRole("button", { name: "Cancel" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/admin", "/admin/media", "/admin/sessions"]) {
    await page.goto(route);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
});
test("a post's cover is chosen from the media picker inside the post editor", async ({
  page,
}) => {
  await openMedia(page);
  await page.goto("/admin/posts");
  const post = seed.posts.find(
    (post) => post.status === "published" && post.access === "public",
  )!;
  await page.getByRole("button", { name: `Edit: ${post.title}` }).click();
  const editor = page.getByRole("dialog", { name: `Edit: ${post.title}` });
  await editor.getByRole("button", { name: "Select media" }).click();
  const picker = page.getByRole("dialog", { name: "Choose an image" });
  await picker.getByRole("tab", { name: "Upload files" }).click();
  await picker.locator('input[type="file"]').setInputFiles({
    name: "cover-pick.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(picker.locator(".media-picker-selection")).toHaveText(
    "cover-pick.png",
  );
  await picker.getByLabel("Image description").fill("A picked cover");
  await picker.getByRole("button", { name: "Use this image" }).click();
  await expect(editor.locator(".cover-field")).toContainText("cover-pick.png");
  await editor.getByRole("button", { name: "Save changes" }).click();
  await expect(editor).toBeHidden();
  await page.goto(`/post/${post.id}`);
  await expect(page.locator(".article-cover")).toHaveAttribute(
    "src",
    /^\/api\/site-image\//,
  );
  await expect(page.locator(".article-cover")).toHaveAttribute(
    "alt",
    "A picked cover",
  );
  await page.goto("/admin/media");
  await chooseGroup(page, "Blog posts");
  await placement(page, post.title)
    .getByRole("button", { name: "Restore original", exact: true })
    .click();
  await expect(pageStatus(page)).toHaveText("Original image restored.");
});
