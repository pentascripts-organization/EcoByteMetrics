import { expect, test, type Page } from "@playwright/test";

import { attachEvidence, mockAnonymousSession, mockMonitoring, monitoringEndpoint, sample, service, snapshot } from "./monitoring-fixtures";

test.beforeEach(async ({ page }) => {
  await mockAnonymousSession(page);
});

const refreshIntervalLabel = "Consulta automática a cada 30 s";

async function expectFitsViewportWidth(page: Page, selector: string) {
  const box = await page.locator(selector).boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
}

test("monitoring refresh updates data without reloading the page", async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => {
    window.name = crypto.randomUUID();
  });
  const firstReading = new Date().toISOString();
  const secondReading = new Date(Date.parse(firstReading) + 30_000).toISOString();
  let releaseRefresh!: () => void;
  const refreshGate = new Promise<void>(resolve => { releaseRefresh = resolve; });
  let requests = 0;
  await page.route(monitoringEndpoint, async (route) => {
    const request = ++requests;
    if (request === 2) await refreshGate;
    await route.fulfill({
      json: snapshot({
        services: [service({ emissionsG: request, lastCollectionAt: request === 1 ? firstReading : secondReading })],
        history: [sample({ emissionsG: request })],
      }),
    });
  });

  await page.goto("/dashboard");
  await page.clock.runFor(1);
  await expect(page.locator(".monitoring-sample-value")).toContainText("1 g", { timeout: 15_000 });
  const documentToken = await page.evaluate(() => window.name);
  const time = page.locator(".monitoring-update time");
  const interval = page.getByText(refreshIntervalLabel, { exact: true });
  const readings = await page.evaluate(
    stamps => stamps.map(stamp => new Date(stamp).toLocaleString("pt-BR")),
    [firstReading, secondReading],
  );
  await expect(interval).toBeVisible();
  await expect(time).toHaveAttribute("datetime", firstReading);
  await expect(time).toHaveText(readings[0]!);
  await expectFitsViewportWidth(page, ".monitoring-applications .monitoring-section-heading");

  try {
    await page.clock.fastForward(30_000);
    await expect.poll(() => requests).toBe(2);
    await expect(page.getByRole("button", { name: "Consultando dados salvos" })).toBeDisabled();
    await expect(time).toHaveAttribute("datetime", firstReading);
    await expect(interval).toBeVisible();
  } finally {
    releaseRefresh();
  }
  await expect(page.locator(".monitoring-sample-value")).toContainText("2 g");
  await expect(time).toHaveAttribute("datetime", secondReading);
  await expect(time).toHaveText(readings[1]!);
  expect(await page.evaluate(() => window.name)).toBe(documentToken);
  await attachEvidence(page, "automatic-refresh-without-reload");
});

test("monitoring loading state resolves when the first response arrives", async ({ page }) => {
  let releaseResponse!: () => void;
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  await page.route(monitoringEndpoint, async (route) => {
    await responseGate;
    await route.fulfill({ json: snapshot() });
  });

  await page.goto("/dashboard");
  const loading = page.getByRole("heading", { name: /Observando o ambiente/ });
  await expect(loading).toBeVisible();
  await expect(page.getByText("Consultando registros…", { exact: true })).toBeVisible();
  await expect(page.getByText(refreshIntervalLabel, { exact: true })).toBeVisible();
  await expect(page.locator(".monitoring-update time")).toHaveCount(0);
  await expectFitsViewportWidth(page, ".monitoring-state");
  await attachEvidence(page, "initial-loading-state");

  releaseResponse();
  await expect(page.locator(".monitoring-card-name-btn")).toContainText("Billing API");
});

test("an empty monitoring response has a stable empty state", async ({ page }) => {
  await page.route(monitoringEndpoint, (route) =>
    route.fulfill({ json: snapshot({ services: [], history: [] }) }),
  );

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /O ambiente est\u00e1 tranquilo/ })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Ainda sem leituras nesta seleção", { exact: true })).toBeVisible();
  await expect(page.getByText(refreshIntervalLabel, { exact: true })).toBeVisible();
  await expect(page.locator(".monitoring-update time")).toHaveCount(0);
  await expectFitsViewportWidth(page, ".monitoring-state");
  await attachEvidence(page, "empty-monitoring-state");
});

test("incomplete carbon samples stay unknown and render without layout overflow", async ({ page }) => {
  await page.route(monitoringEndpoint, (route) =>
    route.fulfill({
      json: snapshot({
        services: [service({ emissionsG: null })],
        history: [sample({ emissionsG: null })],
      }),
    }),
  );

  await page.goto("/dashboard?aba=evolucao");
  await expect(page.getByRole("heading", { name: /Ainda faltam dados de emiss/ })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("body")).not.toContainText("NaN");
  const box = await page.locator(".observatory-empty").boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
  await attachEvidence(page, "incomplete-carbon-state");
});

test("evolution uses the visible selection for percentages and explains the current chart", async ({ page }, info) => {
  const billing = service();
  const other = { ...billing, id: "other", name: "Other service" };
  const reading = sample();
  await mockMonitoring(page, snapshot({
    services: [billing, other],
    history: [reading, { ...reading, serviceId: other.id, emissionsG: 3 }],
  }));
  await page.goto("/dashboard?aba=evolucao&faixa=billing-api&faixa=billing-api");
  const inspector = page.locator(".observatory-inspector");
  if (info.project.name === "desktop") {
    await expect(page.locator(".observatory-treemap-card")).toBeVisible({ timeout: 15_000 });
  } else {
    await expect(page.locator(".observatory-mobile-bars button")).toHaveCount(1);
  }
  await expect(inspector.locator(".observatory-inspector-info")).toContainText("100%");
  await page.getByRole("button", { name: "Sobre estimativas ambientais" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: info.project.name === "mobile" ? "Como ler o gráfico de barras" : "Como ler o Treemap" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Sobre estimativas ambientais" })).toBeFocused();
});

test("opening an application waits for discovery and distinguishes connection failure", async ({ page }) => {
  let releaseResponse!: () => void;
  const responseGate = new Promise<void>(resolve => { releaseResponse = resolve; });
  let first = true;
  await page.route(monitoringEndpoint, async route => {
    if (first) {
      first = false;
      await responseGate;
      await route.fulfill({ status: 503, json: { error: "Unavailable" } });
      return;
    }
    await route.fulfill({ json: snapshot() });
  });

  await page.goto("/dashboard?servico=billing-api");
  await expect(page.getByRole("heading", { name: "Consultando aplicação" })).toBeVisible({ timeout: 15_000 });
  releaseResponse();
  await expect(page.getByRole("heading", { name: "Consulta indisponível" })).toBeVisible();
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByRole("heading", { name: "Billing API", exact: true })).toBeVisible();
});

test("an application link with the administration parameter returns to the list", async ({ page }) => {
  await mockMonitoring(page);
  await page.goto("/dashboard?aba=administracao&servico=billing-api");
  await expect(page.getByRole("heading", { name: "Billing API", exact: true })).toBeVisible({ timeout: 15_000 });
  await page.locator(".monitoring-back").click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Monitoramento", exact: true })).toBeVisible();
});

test("background refresh preserves a confirmed missing application", async ({ page }) => {
  await page.clock.install();
  let releaseRefresh!: () => void;
  const refreshGate = new Promise<void>(resolve => { releaseRefresh = resolve; });
  let requests = 0;
  await page.route(monitoringEndpoint, async route => {
    if (++requests === 2) await refreshGate;
    await route.fulfill({ json: snapshot({ services: [], history: [] }) });
  });
  await page.goto("/dashboard?servico=unknown");
  const missing = page.getByRole("heading", { name: "Aplicação não encontrada" });
  await expect(missing).toBeVisible({ timeout: 15_000 });
  try {
    await page.clock.fastForward(30_000);
    await expect.poll(() => requests).toBe(2);
    await expect(missing).toBeVisible();
  } finally {
    releaseRefresh();
  }
});

test("changing metric preserves the paused interval and the chart follows catalog replacement", async ({ page }) => {
  await page.clock.install();
  const billing = service();
  const nextService = { ...billing, id: "replacement", name: "Replacement API" };
  const last = sample();
  const history = Array.from({ length: 5 }, (_, index) => ({
    ...last, collectedAt: new Date(Date.parse(last.collectedAt) - (4 - index) * 60_000).toISOString(),
  }));
  let requests = 0;
  await page.route(monitoringEndpoint, route => route.fulfill({ json: ++requests === 1
    ? snapshot({ services: [billing], history })
    : snapshot({ services: [nextService], history: history.map(point => ({ ...point, serviceId: nextService.id })) }),
  }));
  await page.goto("/dashboard?aba=evolucao");
  const play = page.getByRole("button", { name: /Reproduzir hist/ });
  const timeline = page.getByRole("slider", { name: /Explorar intervalos/ });
  await expect(play).toBeEnabled({ timeout: 15_000 });
  await play.click();
  await page.clock.fastForward(4500);
  const current = await timeline.inputValue();
  expect(current).not.toBe(await timeline.getAttribute("max"));
  await page.getByRole("button", { name: "Energia", exact: true }).click();
  await expect(play).toBeVisible();
  await expect(timeline).toHaveValue(current);

  await page.clock.fastForward(30_000);
  await expect(page.locator(".observatory-inspector").getByRole("heading", { name: "Replacement API" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Aplic.*1/, exact: true })).toBeVisible();
});

test("evolution distinguishes a failed query from an empty period", async ({ page }) => {
  await page.route(monitoringEndpoint, route => route.fulfill({ status: 503, json: { error: "Unavailable" } }));
  await page.goto("/dashboard?aba=evolucao");
  await expect(page.getByRole("heading", { name: "Não foi possível carregar as leituras" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Nenhum registro neste período" })).toHaveCount(0);
});

test("manual historical cutoff replaces the selected instant in both query and banner", async ({ page }) => {
  const earlier = "2025-06-01T15:00:00.000Z";
  const cutoff = "2025-06-02T15:00:00.000Z";
  await page.route(monitoringEndpoint, route => {
    const until = new URL(route.request().url()).searchParams.get("until");
    return route.fulfill({ json: { ...snapshot(), historyUntil: until, selectedAt: until } });
  });
  await page.goto("/dashboard?instante=" + encodeURIComponent(earlier));
  await expect(page.locator(".monitoring-past-banner")).toContainText("01/06/2025", { timeout: 15_000 });
  await page.getByRole("button", { name: /^Filtrar/ }).click();
  const date = await page.evaluate(value => {
    const time = new Date(value);
    return new Date(time.getTime() - time.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  }, cutoff);
  const response = page.waitForResponse(item => item.ok() && new URL(item.url()).searchParams.get("until") === cutoff);
  await page.getByLabel(/Consultar o passado at/).fill(date);
  await response;
  await page.getByRole("button", { name: "Ver resultados" }).click();
  await expect(page).toHaveURL(url => !url.searchParams.has("instante") && url.searchParams.get("ate") === date);
  await expect(page.locator(".monitoring-past-banner")).toContainText("02/06/2025");
});

test("individual history distinguishes partial estimates, gaps and a failed query", async ({ page }) => {
  await mockMonitoring(page, snapshot({ history: [{ ...sample({ emissionsG: 0.04 }), sampleCount: 2, emissionCount: 1 }] }));
  let failHistory = false;
  await page.route(monitoringEndpoint, route => {
    if (failHistory && new URL(route.request().url()).searchParams.get("view") !== "latest") {
      return route.fulfill({ status: 503, json: { error: "Unavailable" } });
    }
    return route.fallback();
  });
  await page.goto("/dashboard?servico=billing-api&detalhe=evolucao&serie=intervalos");
  const panel = page.locator(".service-history-card");
  const sparkline = panel.locator(".evolution-sparkline-wrap");
  await expect(sparkline).toBeVisible({ timeout: 15_000 });
  await expect(sparkline.getByText("Sem registros", { exact: true })).toHaveCount(0);

  await panel.getByRole("tab", { name: "Valores" }).click();
  const reading = panel.locator("tbody td").first();
  await expect(reading).toContainText("0,04");
  await expect(reading).toContainText("Cálculo parcial");
  await expect(reading).toHaveAttribute("title", /1 de 2 amostras/);

  failHistory = true;
  await page.goto("/dashboard?servico=billing-api");
  await page.getByRole("heading", { name: "Billing API", exact: true }).waitFor();
  await page.getByRole("tab", { name: /Hist.rico/ }).click();
  await expect(panel.getByRole("heading", { name: "Não foi possível carregar as leituras" })).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Nenhum registro neste período" })).toHaveCount(0);
  await panel.getByRole("tab", { name: "Valores" }).click();
  await expect(panel.getByRole("status").filter({ hasText: "Não foi possível carregar as leituras." })).toBeVisible();
});
