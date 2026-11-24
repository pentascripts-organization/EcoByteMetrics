import { expect, test } from "@playwright/test";
import { attachEvidence, mockMonitoring, sample, service, snapshot } from "./monitoring-fixtures";

test.use({ reducedMotion: "reduce" });
test.setTimeout(60_000);

test("comparison supports empty, single, paired and stacked states", async ({ page }, info) => {
  const services = Array.from({ length: 8 }, (_, index) => ({
    ...service(), id: "application-" + index, name: "Application " + (index + 1),
  }));
  const history = services.flatMap((entry, index) => [5, 15, 20].map(minutes => ({
    ...sample(), serviceId: entry.id, collectedAt: new Date(Date.now() - minutes * 60_000).toISOString(),
    energyKwh: (index + minutes) / 1000,
  })));
  await mockMonitoring(page, snapshot({ services, history }));
  await page.goto("/dashboard?aba=comparar&periodo=24h");
  await expect(page.getByRole("heading", { name: "Selecione duas ou mais aplicações para começar a comparação" })).toBeVisible();
  await page.getByRole("button", { name: "Escolher aplicações" }).click();
  await page.getByRole("checkbox", { name: /Application 1/ }).click();
  await expect(page.getByText("Selecione mais uma aplicação para comparar.")).toBeVisible();
  await page.getByRole("checkbox", { name: /Application 2/ }).click();
  await page.getByRole("button", { name: "Concluir" }).click();
  const cards = page.locator(".comparison-graph-grid article");
  await expect(cards).toHaveCount(2);
  await expect(cards.first().locator(".recharts-area")).toBeVisible();
  const axis = ".recharts-yAxis-tick-labels text";
  await expect.poll(() => cards.first().locator(axis).count()).toBeGreaterThan(1);
  await expect(cards.last().locator(axis)).toHaveText(await cards.first().locator(axis).allTextContents());
  if (info.project.name === "desktop") {
    for (const width of [1919, 1672, 1280, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 958 });
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
      if ([1919, 768, 390].includes(width)) await attachEvidence(page, "comparacao-" + width);
    }
  }
  await page.getByRole("button", { name: "CO₂e", exact: true }).click();
  await expect(cards.first()).toContainText("g CO₂e");
  await page.getByRole("button", { name: "Alterar seleção" }).click();
  await page.getByRole("checkbox", { name: /Application 3/ }).click();
  await expect(cards).toHaveCount(3);
  await page.getByRole("button", { name: "Selecionar visíveis" }).click();
  await page.getByRole("button", { name: "Concluir" }).click();
  await expect(page.locator(".comparison-count-badge")).toHaveText("Aplicações selecionadas · 8");
  await expect(cards).toHaveCount(8);
  await expect(page.getByRole("button", { name: "Próximos gráficos" })).toHaveCount(0);
  if (info.project.name === "desktop") await page.setViewportSize({ width: 1440, height: 958 });
  await expect.poll(() => cards.evaluateAll(elements => elements.every((element, index) =>
    index === 0 || element.getBoundingClientRect().top > elements[index - 1]!.getBoundingClientRect().bottom
  ))).toBe(true);
  await expect(cards.last().getByRole("heading")).toHaveText("Application 8");
  await page.getByRole("button", { name: "Ver indicadores detalhados" }).click();
  await expect(cards).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("columnheader", { name: "Application 8" })).toBeAttached();
  await expect(page.getByLabel("Período da comparação")).toHaveValue("24h");
  await page.getByRole("button", { name: "Gráficos", exact: true }).click();
  await expect(page.getByRole("button", { name: "CO₂e", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("history without readings offers a separate latest reading", async ({ page }) => {
  await mockMonitoring(page, snapshot({ history: [] }));
  await page.goto("/dashboard?aba=comparar&app=billing-api");
  await expect(page.getByText("Sem coletas registradas no período.")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("combobox", { name: "Dados da comparação" }).selectOption("ultima");
  await expect(page.getByText("Energia na última coleta")).toBeVisible();
  await expect(page.locator(".recharts-area")).toHaveCount(0);
});
