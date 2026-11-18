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

test("filter drawer opens and closes on every monitoring screen", async ({ page, isMobile }) => {
  test.skip(isMobile, "The service list is desktop-only in this layout");

  for (const path of ["/dashboard", "/dashboard?aba=evolucao", "/dashboard?aba=comparar"]) {
    await page.goto(path);
    const filterButton = page.getByRole("button", { name: /^Filtrar/ });
    const dialog = page.locator("#monitoring-filters");

    await expect(filterButton).toBeVisible();
    await filterButton.click();
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveJSProperty("open", true);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  }

  await page.goto("/dashboard");
  const firstService = page.locator(".monitoring-card-name-btn").first();
  await expect(firstService).toBeVisible();
  const serviceName = (await firstService.innerText()).trim();
  await firstService.click();
  await expect(page.getByRole("heading", { name: serviceName, exact: true })).toBeVisible();

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
});
