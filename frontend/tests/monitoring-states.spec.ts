import { expect, test, type Page } from "@playwright/test";

import { attachEvidence, mockAnonymousSession, monitoringEndpoint, sample, service, snapshot } from "./monitoring-fixtures";

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
  await expect(page.getByRole("heading", { name: /Ainda faltam dados de emiss/ })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("NaN");
  const box = await page.locator(".observatory-empty").boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
  await attachEvidence(page, "incomplete-carbon-state");
});
