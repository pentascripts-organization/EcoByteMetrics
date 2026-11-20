import { expect, test } from "@playwright/test";

import { mockAnonymousSession, mockMonitoring } from "./monitoring-fixtures";

test("homepage renders", async ({ page }) => {
  await mockAnonymousSession(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await expect(page.locator("#conteudo")).toBeVisible();
  await expect(page.locator("main h1").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("dashboard renders", async ({ page }) => {
  await mockMonitoring(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Monitoramento" })).toBeVisible({ timeout: 15_000 });
  expect(errors).toEqual([]);
});

test("filter drawer opens and closes on every monitoring screen", async ({ page }) => {
  test.setTimeout(60_000);
  await mockMonitoring(page);

  for (const path of ["/dashboard", "/dashboard?aba=evolucao", "/dashboard?aba=comparar"]) {
    await page.goto(path);
    const filterButton = page.getByRole("button", { name: /^Filtrar/ });
    const dialog = page.locator("#monitoring-filters");

    await expect(filterButton).toBeVisible({ timeout: 15_000 });
    await filterButton.click();
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveJSProperty("open", true);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  }

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Brasil Billing API", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Billing API", exact: true })).toBeVisible();

  const detailFilterButton = page.getByRole("button", { name: /^Filtrar/ });
  const detailDialog = page.locator("#monitoring-filters");
  await expect(detailFilterButton).toBeVisible();
  await detailFilterButton.click();
  await expect(detailDialog).toBeVisible();
  await expect(detailDialog).toHaveJSProperty("open", true);
  await page.getByRole("button", { name: "Ver resultados" }).click();
  await expect(detailDialog).toHaveCount(0);

  await page.getByRole("tab", { name: "Histórico" }).click();
  await detailFilterButton.click();
  await expect(detailDialog).toBeVisible();
  await expect(detailDialog).toHaveJSProperty("open", true);
  await page.keyboard.press("Escape");
  await expect(detailDialog).toHaveCount(0);
});
