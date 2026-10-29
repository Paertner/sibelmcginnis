import { test, expect } from "@playwright/test";

test("consultation scheduling uses an accessible monthly calendar and responsive time picker", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".stats-row")).toHaveCount(0);
  await page.goto("/login");
  await page.getByRole("button", { name: /Layla Demir/ }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.goto("/account?tab=book");
  await expect(
    page.getByRole("table", { name: "Choose a consultation date" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Request consultation", exact: true }),
  ).toBeDisabled();
  const day = page.getByRole("button", { name: /^Choose / }).first();
  await day.click();
  await expect(day).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("radio").first().check();
  await expect(
    page.getByRole("button", { name: "Request consultation", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByLabel("What would you like to talk about?"),
  ).toBeVisible();
  const next = page.getByRole("button", { name: "Next month", exact: true });
  if (await next.isEnabled()) {
    await next.click();
    await expect(
      page.getByRole("button", { name: "Request consultation", exact: true }),
    ).toBeDisabled();
    await page
      .getByRole("button", { name: "Previous month", exact: true })
      .click();
  }
  await page
    .locator(".booking-widget")
    .screenshot({ path: "test-results/consultation-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page
    .locator(".booking-widget")
    .screenshot({ path: "test-results/consultation-mobile.png" });
});
