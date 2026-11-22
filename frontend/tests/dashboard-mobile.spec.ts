import { expect, test } from "@playwright/test";
import { attachEvidence, mockMonitoring, sample, service, snapshot } from "./monitoring-fixtures";

test.use({ reducedMotion: "reduce" });

test("mobile dashboard keeps navigation, cards and comparison within the viewport", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "Uses the mobile project.");
  test.setTimeout(90_000);
  const billing = service();
  const reports = { ...billing, id: "reports-api", name: "Reports API" };
  const zero = { ...billing, id: "zero-api", name: "Zero API with a very long application name", emissionsG: 0 };
  const missing = { ...billing, id: "missing-api", name: "Missing API", emissionsG: null };
  const latestSample = sample();
  const earlier = { ...latestSample, collectedAt: new Date(Date.parse(latestSample.collectedAt) - 30_000).toISOString() };
  await mockMonitoring(page, snapshot({
    services: [billing, reports, zero, missing],
    history: [earlier, latestSample, { ...latestSample, serviceId: reports.id },
      { ...latestSample, serviceId: zero.id, emissionsG: 0 },
      { ...latestSample, serviceId: missing.id, emissionsG: null, emissionCount: 0 }],
  }));
  await page.goto("/dashboard");
  await expect(page.getByText("Consulta automática a cada 30 s")).toBeVisible({ timeout: 15_000 });

  const pageWidth = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await expect.poll(pageWidth).toBeLessThanOrEqual(1);
    const card = page.locator(".monitoring-card-header").first();
    await expect(card).toBeVisible();
    await expect(card.locator(".monitoring-card-status-col")).toHaveCSS("grid-area", "status");
    await expect(card.locator(".monitoring-card-metric-col")).toHaveCSS("grid-area", "metric");
  }

  await page.getByRole("button", { name: /^Filtrar/ }).click();
  const filters = page.locator("#monitoring-filters");
  await expect(filters).toBeVisible();
  await expect(filters.getByRole("button", { name: "Limpar filtros" })).toBeVisible();
  await filters.getByRole("button", { name: "Ver resultados" }).click();
  await expect(filters).toHaveCount(0);
  await attachEvidence(page, "mobile-services");

  await page.getByRole("tab", { name: "Mapa", exact: true }).click();
  await expect(page.locator(".monitoring-location .globe-anchor")).toBeVisible();
  await expect.poll(pageWidth).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "Expandir visão do globo" }).click();
  await expect(page.locator(".skip-link")).toHaveJSProperty("inert", true);
  await page.getByRole("button", { name: /Voltar ao painel/ }).click();
  await expect(page.getByRole("button", { name: "Expandir visão do globo" })).toBeFocused();

  await page.getByRole("tab", { name: "Mapa", exact: true }).press("ArrowRight");
  const evolutionTab = page.getByRole("tab", { name: "Evolução", exact: true });
  await expect(evolutionTab).toHaveAttribute("aria-selected", "true");
  await expect(evolutionTab).toBeFocused();
  await expect(page.locator(".observatory-heading")).toBeVisible();
  const bars = page.locator(".observatory-mobile-bars");
  const footer = page.locator(".observatory-footer");
  const inspector = page.locator(".observatory-inspector");
  await expect(bars.getByRole("button")).toHaveCount(4);
  await expect(bars.getByRole("button", { name: /Billing API/ })).toContainText("2 g");
  await expect(bars.getByRole("button", { name: /Zero API/ })).toContainText("0 g");
  await expect(bars.getByRole("button", { name: /Missing API/ })).toContainText("Sem dados");
  const timeline = page.getByRole("slider", { name: /^Explorar intervalos/ });
  for (const [width, height] of [[320, 560], [360, 740], [390, 844], [430, 932]]) {
    await page.setViewportSize({ width, height });
    await expect.poll(pageWidth).toBeLessThanOrEqual(1);
    await expect(bars).toBeVisible();
    const [plot, time, summary] = await Promise.all([page.locator(".observatory-stage").boundingBox(), footer.boundingBox(), inspector.boundingBox()]);
    expect(plot!.y + plot!.height).toBeLessThanOrEqual(time!.y);
    expect(time!.y + time!.height).toBeLessThanOrEqual(summary!.y);
    const details = inspector.getByRole("button", { name: "Explorar detalhes" });
    await details.scrollIntoViewIfNeeded();
    await expect(details).toBeInViewport({ ratio: 1 });
    await timeline.scrollIntoViewIfNeeded();
    await expect(timeline).toBeInViewport();
  }
  await page.getByRole("button", { name: "Intervalo anterior" }).click();
  await expect(timeline).toHaveValue("0");
  await bars.getByRole("button", { name: /Missing API/ }).click();
  await expect(inspector.getByRole("heading", { name: "Missing API" })).toBeVisible();
  await page.getByRole("button", { name: "Energia", exact: true }).click();
  await expect(bars.getByRole("button", { name: /Billing API/ })).toContainText("kWh");
  await page.getByRole("button", { name: /^Filtrar/ }).click();
  await expect(filters.getByRole("searchbox")).toBeVisible();
  await filters.getByRole("button", { name: "Ver resultados" }).click();
  await page.getByRole("button", { name: "Explorar detalhes" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Fechar detalhes" }).click();
  await attachEvidence(page, "mobile-evolution");
  const accumulated = page.getByRole("button", { name: "Acumulado", exact: true });
  await accumulated.click();
  await expect(accumulated).toHaveAttribute("aria-pressed", "true");
  const period = page.locator(".observatory-tools select");
  await period.selectOption("24h");
  await expect(period).toHaveValue("24h");
  await expect(bars.getByRole("button")).toHaveCount(4);
  await page.getByRole("button", { name: /Aplic.*4/ }).click();
  const selection = page.getByRole("dialog");
  for (const name of [/Reports API/, /Zero API/, /Missing API/]) {
    const checkbox = selection.getByRole("checkbox", { name });
    await checkbox.tap();
    await expect(checkbox).not.toBeChecked();
  }
  await selection.getByRole("button", { name: "Fechar detalhes" }).click();
  await expect(bars.getByRole("button")).toHaveCount(1);
  await expect(bars.getByRole("button", { name: /Billing API/ })).toContainText("kWh");
  await page.setViewportSize({ width: 430, height: 844 });

  await page.goto("/dashboard?aba=comparar&comparacao=ultima&comparacaoVisao=numeros&app=billing-api&app=reports-api");
  const comparison = page.getByRole("region", { name: "Indicadores lado a lado" });
  await expect(comparison.getByRole("columnheader", { name: "Reports API" })).toBeVisible({ timeout: 15_000 });
  await expect(comparison.getByRole("rowheader", { name: "CPU (%)" })).toHaveCSS("position", "sticky");
  await expect.poll(pageWidth).toBeLessThanOrEqual(1);
  await attachEvidence(page, "mobile-comparison");

  await page.goto("/dashboard?servico=billing-api");
  await expect(page.locator(".service-detail-overview")).toHaveCSS("grid-template-areas", '"identity" "impact" "resources" "globe"');
  await page.getByRole("tab", { name: "Histórico" }).click();
  await expect(page.locator(".service-history-card")).toBeVisible();
  try {
    await expect.poll(pageWidth).toBeLessThanOrEqual(1);
  } catch (error) {
    console.log(await page.evaluate(() => [...document.querySelectorAll("body *")].filter(n => n.getBoundingClientRect().right > document.documentElement.clientWidth + 1).map(n => [n.tagName, n.getAttribute("class"), n.parentElement?.getAttribute("class"), Math.round(n.getBoundingClientRect().right)]).slice(0, 40)));
    throw error;
  }

  await page.goto("/dashboard?aba=administracao");
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect.poll(pageWidth).toBeLessThanOrEqual(1);
});
