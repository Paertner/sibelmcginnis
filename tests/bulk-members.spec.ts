import { test, expect, type Page } from "@playwright/test";

async function addMember(page: Page, name: string, email: string) {
  await page.getByRole("button", { name: "+ Add member" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Full name").fill(name);
  await dialog.getByLabel("Email").fill(email);
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText(email, { exact: true })).toBeVisible();
}

test("admin selects members, edits them in bulk and deletes them", async ({
  page,
}) => {
  const stamp = Date.now();
  await page.goto("/login");
  await page.getByRole("button", { name: /Sibel/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/members");
  const first = `Bulk One ${stamp}`,
    second = `Bulk Two ${stamp}`;
  await addMember(page, first, `bulk1-${stamp}@example.test`);
  await addMember(page, second, `bulk2-${stamp}@example.test`);

  // No toolbar until something is selected.
  await expect(page.getByRole("toolbar")).toHaveCount(0);
  await page.getByRole("checkbox", { name: `Select ${first}` }).check();
  await page.getByRole("checkbox", { name: `Select ${second}` }).check();
  const toolbar = page.getByRole("toolbar", {
    name: "Actions for the selected members",
  });
  await expect(toolbar).toContainText("2 selected");

  // A search hides the second member, which then leaves the selection.
  await page.getByLabel("Search members").fill(first);
  await expect(toolbar).toContainText("1 selected");
  await page.getByLabel("Search members").fill(`Bulk`);
  await expect(toolbar).toContainText("1 selected");
  await page.getByRole("checkbox", { name: `Select ${second}` }).check();
  await expect(toolbar).toContainText("2 selected");

  // Password links need the real sign-in, so the button is off in this review.
  await expect(
    toolbar.getByRole("button", { name: "Send password link" }),
  ).toBeDisabled();

  // Bulk edit: only the filled-in things change.
  await toolbar.getByRole("button", { name: "Bulk edit" }).click();
  const edit = page.getByRole("dialog", { name: "Edit 2 members" });
  await edit.getByLabel("Status").selectOption("paused");
  await edit.getByLabel("Add to the private note").fill("Imported in bulk");
  await edit.getByRole("button", { name: "Apply to 2 members" }).click();
  await expect(page.getByText("Updated 2 members.")).toBeVisible();
  await expect(toolbar).toHaveCount(0);
  for (const name of [first, second]) {
    const row = page.getByRole("row", { name: new RegExp(name) });
    await expect(row).toContainText("paused");
    await expect(row).toContainText("free");
    await expect(row).toContainText("Imported in bulk");
  }

  // Select all shown, then delete after confirming.
  await page
    .getByRole("checkbox", { name: "Select all members shown" })
    .check();
  await expect(toolbar).toContainText("selected");
  await page
    .getByRole("checkbox", { name: "Select all members shown" })
    .uncheck();
  await expect(toolbar).toHaveCount(0);
  await page.getByRole("checkbox", { name: `Select ${first}` }).check();
  await page.getByRole("checkbox", { name: `Select ${second}` }).check();
  await toolbar.getByRole("button", { name: "Delete", exact: true }).click();
  const confirm = page.getByRole("alertdialog");
  await expect(confirm).toContainText("Delete 2 members?");
  await confirm.getByRole("button", { name: "Yes, delete 2" }).click();
  await expect(page.getByText("Deleted 2 members.")).toBeVisible();
  await expect(page.getByText(first)).toHaveCount(0);
  await expect(page.getByText(second)).toHaveCount(0);
});
