import { expect, test } from "@playwright/test";

const link = (page: import("@playwright/test").Page) =>
  page.locator("a.pcard", { hasText: "Hear the episodes" });

test("the home podcast card sends each kind of visitor where it makes sense", async ({
  page,
}) => {
  await page.goto("/");
  await expect(link(page)).toHaveAttribute("href", "/join?plan=premium");
  for (const [name, href] of [
    ["Amelia", "/account?tab=membership"],
    ["Layla", "/account?tab=podcast"],
  ] as const) {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByRole("button", { name: new RegExp(name) }).click();
    await expect(page).toHaveURL(/\/account/);
    await page.goto("/");
    await expect(link(page)).toHaveAttribute("href", href);
  }
});
