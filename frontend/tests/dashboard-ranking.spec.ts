import { expect, test } from "@playwright/test";
import { attachEvidence, mockMonitoring, service, snapshot } from "./monitoring-fixtures";

test.use({ reducedMotion: "reduce" });

const billing = "Billing API";
const reports = "Reports API";
const archive = "Archive API";

test.beforeEach(async ({ page }) => {
  await mockMonitoring(page, snapshot({
    services: [
      { ...service({ emissionsG: null }), id: "archive-api", name: archive, energyKwh: 0.001 },
      {
        ...service({ emissionsG: 1 }), id: "reports-api", name: reports, energyKwh: 0.006,
        country: "Canada", region: "Ontario", regionCode: "ca-on", city: "Toronto",
        latitude: 43.65, longitude: -79.38,
      },
      service({ emissionsG: 3 }),
    ],
    history: [],
  }));
  await page.goto("/dashboard");
});

test("latest readings match the dashboard totals and both ranking criteria", async ({ page }) => {
  const totals = page.getByRole("region", { name: "Totais da seleção" });
  const rows = page.getByRole("table").locator("tbody tr");
  const names = rows.locator(".monitoring-card-name-btn");
  const values = rows.locator(".monitoring-sample-value");

  await expect(totals.locator(".monitoring-visible-totals > div > strong")).toHaveText(["4 g CO₂e", "0,009 kWh"]);
  await expect(names).toHaveText([billing, reports, archive]);
  await expect(values).toHaveText(["3 g", "1 g", "—"]);
  await attachEvidence(page, "ranking-emissoes");

  await page.getByRole("button", { name: /^Indicador ativo: Emissões/ }).click();
  await page.getByRole("menuitem", { name: "Energia" }).click();
  await expect(names).toHaveText([reports, billing, archive]);
  await expect(values).toHaveText(["0,006 kWh", "0,002 kWh", "0,001 kWh"]);
  await attachEvidence(page, "ranking-energia");
});

test("filters update the dashboard and can recover an empty selection", async ({ page }) => {
  test.setTimeout(60_000);
  const open = page.getByRole("button", { name: /^Filtrar/ });
  const dialog = page.getByRole("dialog", { name: "Filtros e histórico" });
  const results = dialog.getByRole("button", { name: "Ver resultados" });
  const names = page.getByRole("table").locator(".monitoring-card-name-btn");
  const totals = page.getByRole("region", { name: "Totais da seleção" });

  await expect(names).toHaveText([billing, reports, archive], { timeout: 15_000 });
  await open.click();
  await dialog.getByRole("combobox", { name: "País", exact: true }).click();
  await dialog.getByRole("option", { name: "Canadá", exact: true }).click();
  await results.click();
  await expect(names).toHaveText([reports]);
  await expect(totals.locator(".monitoring-visible-totals > div > strong")).toHaveText(["1 g CO₂e", "0,006 kWh"]);
  await attachEvidence(page, "dashboard-filtrado");

  await open.click();
  await dialog.getByRole("combobox", { name: "Situação da aplicação" }).click();
  await dialog.getByRole("option", { name: "Removido", exact: true }).click();
  await results.click();
  await expect(page.getByRole("heading", { name: "Nenhuma aplicação nesta seleção" })).toBeVisible();
  await expect(names).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await attachEvidence(page, "dashboard-sem-resultados");

  await open.click();
  await dialog.getByRole("button", { name: "Limpar filtros" }).click();
  await results.click();
  await expect(names).toHaveText([billing, reports, archive]);
});

test("comparison counts only available selections and renders accented mobile labels", async ({ page }) => {
  const selection = "/dashboard?aba=comparar&comparacao=ultima&comparacaoVisao=numeros&app=billing-api&app=reports-api";
  await page.goto(selection);
  const comparison = page.getByRole("region", { name: "Indicadores lado a lado" });
  await expect(comparison.locator("caption")).toContainText("Última leitura", { timeout: 15_000 });
  await expect(comparison.getByText("Emissões (kg CO₂e)", { exact: true })).toBeVisible();
  await page.goto(selection + "&pais=Canad%C3%A1");
  await expect(page.locator(".comparison-count-badge")).toHaveText("Aplicações selecionadas · 1", { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Remover seleções indisponíveis" })).toBeVisible();
});

test("comparison keeps small readings, identifies missing ones and finds countries without accents", async ({ page }) => {
  const alpha = { ...service({ emissionsG: 0.04 }), country: "Canada" };
  const beta = { ...service({ emissionsG: null }), id: "beta", name: "Beta API" };
  await mockMonitoring(page, snapshot({ services: [alpha, beta], history: [] }));
  await page.goto("/dashboard?aba=comparar&comparacao=ultima&app=billing-api&app=beta");
  await page.getByRole("button", { name: "CO₂e", exact: true }).click();
  await expect(page.getByRole("article", { name: "Billing API" })).toContainText("0,04 g CO₂e");
  await expect(page.getByRole("article", { name: "Beta API" })).toContainText("Indisponível");
  await page.getByRole("button", { name: "Alterar seleção" }).click();
  await page.getByRole("searchbox", { name: "Buscar aplicação para comparar" }).fill("Canada");
  await expect(page.getByRole("checkbox", { name: /Billing API/ })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /Beta API/ })).toHaveCount(0);
});
