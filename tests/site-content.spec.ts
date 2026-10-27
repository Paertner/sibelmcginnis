import { test, expect } from "@playwright/test";

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
  const editor = page.locator(".content-copy-editor");
  const section = async (name: string) => {
    await editor.getByRole("combobox", { name: "Page or section" }).click();
    await editor.getByRole("option", { name, exact: true }).click();
  };
  await page.goto("/admin/content");
  await page.getByRole("tab", { name: "Page text", exact: true }).click();
  await section("Meet Sibel");
  await editor.getByLabel("Find text in this section").fill("What to Expect");
  const unique = `Your next steps ${Date.now()}`;
  await editor
    .getByRole("textbox", { name: "What to Expect", exact: true })
    .fill(unique);
  await editor.getByLabel("Find text in this section").fill("");
  await section("Navigation");
  await editor
    .getByRole("textbox", { name: "Home", exact: true })
    .fill("Start here");
  await editor
    .getByRole("button", { name: "Save site text", exact: true })
    .click();
  await expect(editor.getByRole("status")).toHaveText("Site text saved.");
  await page.goto("/about");
  await expect(
    page.getByRole("heading", { name: unique, exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Start here", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: unique, exact: true }),
  ).toBeVisible();
  await page.goto("/admin/content");
  await page.getByRole("tab", { name: "Page text", exact: true }).click();
  await section("Meet Sibel");
  await editor.getByLabel("Find text in this section").fill("What to Expect");
  await editor
    .getByRole("button", { name: "Use original text", exact: true })
    .click();
  await editor.getByLabel("Find text in this section").fill("");
  await section("Navigation");
  await editor.getByRole("textbox", { name: "Home", exact: true }).fill("Home");
  await editor
    .getByRole("button", { name: "Save site text", exact: true })
    .click();
  await expect(editor.getByRole("status")).toHaveText("Site text saved.");
  await page.goto("/about");
  await expect(
    page.getByRole("heading", { name: "What to Expect", exact: true }),
  ).toBeVisible();
});
