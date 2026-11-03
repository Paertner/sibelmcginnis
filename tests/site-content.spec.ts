import { test, expect } from "@playwright/test";
import seed from "../src/lib/seed.json";

test("site dropdowns support keyboard selection and stay inside edit dialogs", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Sibel/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/posts");
  const filter = page.getByRole("combobox", { name: "Filter post access" });
  await filter.click();
  await filter.press("End");
  await filter.press("Enter");
  await expect(filter).toHaveText("Drafts");
  await expect(page.locator("tbody tr:visible")).toHaveCount(1);
  await filter.click();
  await filter.press("Escape");
  await expect(page.getByRole("listbox")).not.toBeVisible();
  await page
    .getByRole("button", { name: "+ New blog post", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("combobox", { name: "Who can read this post?" })
    .click();
  await dialog
    .getByRole("option", { name: "Premium members", exact: true })
    .click();
  await expect(dialog.locator("input[name=access]")).toHaveValue("premium");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await page.goto("/contact");
  const interest = page.getByRole("combobox", { name: "I’m interested in" });
  await interest.click();
  await interest.press("c");
  await interest.press("Enter");
  await expect(page.locator("input[name=interest]")).toHaveValue(
    "Corporate solutions",
  );
});

test("admin can edit static page and shared navigation text, then restore defaults", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Sibel/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const open = async () => {
    await page.goto("/admin/content");
    await page.locator(".ve-page select").selectOption({ label: "Meet Sibel" });
    const frame = page.frameLocator("iframe.ve-frame");
    return {
      heading: frame
        .locator("[data-ve]", { hasText: /^What to Expect/ })
        .first(),
      home: frame.locator("nav a[data-ve]", { hasText: /^Home$/ }).first(),
      starter: frame
        .locator("nav a[data-ve]", { hasText: /^Start here$/ })
        .first(),
    };
  };
  const unique = `Your next steps ${Date.now()}`;
  const save = async () => {
    await page.getByRole("button", { name: "Save and publish" }).click();
    await expect(page.locator(".toast").last()).toHaveText("Site text saved.");
  };
  let items = await open();
  await items.heading.click();
  await page.keyboard.press("Control+A");
  await page.keyboard.type(unique);
  await items.home.click();
  await page.keyboard.press("Control+A");
  await page.keyboard.type("Start here");
  await save();
  await page.goto("/about");
  await expect(
    page.getByRole("heading", { name: unique, exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Start here", exact: true }),
  ).toBeVisible();
  items = await open();
  await page
    .frameLocator("iframe.ve-frame")
    .locator("[data-ve]", { hasText: unique })
    .click();
  await page.getByRole("button", { name: "Use original text" }).click();
  await items.starter.click();
  await page.getByRole("button", { name: "Use original text" }).click();
  await save();
  await page.goto("/about");
  await expect(
    page.getByRole("heading", { name: "What to Expect", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Home", exact: true }),
  ).toBeVisible();
});

test("admin can change a post's web address and the old link still works", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Sibel/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/posts");
  const post = seed.posts.find(
    (post) => post.status === "published" && post.access === "public",
  )!;
  const slug = `my-new-address-${Date.now()}`;
  await page.getByRole("button", { name: `Edit: ${post.title}` }).click();
  const editor = page.getByRole("dialog", { name: `Edit: ${post.title}` });
  await editor.getByLabel("Web address: /post/…").fill(slug);
  await editor.getByRole("button", { name: "Save changes" }).click();
  await expect(editor).not.toBeVisible();
  expect((await page.request.get(`/post/${slug}`)).status()).toBe(200);
  expect((await page.request.get(`/post/${post.id}`)).status()).toBe(200);
  await page.goto("/blog");
  await expect(page.locator(`a[href="/post/${slug}"]`).first()).toBeVisible();
});
