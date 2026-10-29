import { test, expect } from "@playwright/test";

test("the password form checks the new password before anything is sent to the real sign-in", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Sibel/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/account?tab=password");
  await expect(
    page.getByRole("heading", { name: "Change password" }),
  ).toBeVisible();
  await page.getByLabel("Current password").fill("old-password-1");
  await page.getByLabel("New password", { exact: true }).fill("new-password-1");
  await page.getByLabel("Repeat new password").fill("new-password-2");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByRole("status")).toContainText("don’t match");
});
