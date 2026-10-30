import { test, expect } from "@playwright/test";

test("the weekly session day is chosen in Settings and the site follows it", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Sibel/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const save = async (day: string, time: string) => {
    await page.goto("/admin/settings");
    await page.getByRole("tab", { name: "Weekly session" }).click();
    await page.getByRole("combobox", { name: "Day of the week" }).click();
    await page.getByRole("option", { name: day, exact: true }).click();
    await page.getByLabel(/Start time/).fill(time);
    await page.getByRole("button", { name: "Save weekly session" }).click();
    await expect(page.getByText("Changes saved")).toBeVisible();
  };
  await save("Friday", "1:00 PM");
  try {
    await page.goto("/");
    await expect(page.locator(".photo-chip")).toContainText("Fridays");
    await expect(page.locator(".photo-chip")).toContainText("1:00 PM");
    await page.goto("/admin/sessions");
    await expect(page.locator(".weekly-settings-note")).toContainText(
      "every Friday at 1:00 PM",
    );
    await page.getByRole("button", { name: "+ Add next session" }).click();
    await expect(page.locator(".date-chip").first()).toBeVisible();
  } finally {
    await save("Saturday", "10:30 AM");
  }
});
