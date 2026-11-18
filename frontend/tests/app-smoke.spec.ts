import { expect, test } from "@playwright/test";

test("homepage renders", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await expect(page.locator("#conteudo")).toBeVisible();
  await expect(page.locator("main h1").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("dashboard renders", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Monitoramento" })).toBeVisible();
  expect(errors).toEqual([]);
});
