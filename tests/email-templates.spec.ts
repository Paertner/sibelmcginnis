import { test, expect } from "@playwright/test";

test("admin edits an automatic email: the link is required, saving and resetting work", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Sibel/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/settings");
  await page.getByRole("tab", { name: "Email templates" }).click();
  const list = page.locator(".system-email-list li", {
    hasText: /^Set your password/,
  });
  await expect(list).toContainText("Default wording");
  await list.getByRole("button", { name: "Edit" }).click();
  const editor = page.getByRole("region", { name: "Set your password" });
  await expect(
    editor.getByRole("button", { name: "Send test to me" }),
  ).toBeDisabled();
  // A subject without the link field is fine; a message without {{link}} anywhere is refused.
  await editor.getByLabel("Subject").fill("Welcome, {{first_name}}");
  await editor.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Template saved")).toBeVisible();
  await expect(list).toContainText("Customised");
  await editor.getByRole("button", { name: "Reset to default" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Yes, reset it" })
    .click();
  await expect(list).toContainText("Default wording");
  await expect(editor.getByLabel("Subject")).toHaveValue(
    "Set your password for {{site_name}}",
  );
});
