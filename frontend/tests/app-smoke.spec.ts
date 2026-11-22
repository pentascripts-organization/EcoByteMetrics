import { expect, test } from "@playwright/test";

import { mockAnonymousSession, mockMonitoring, sample, service, snapshot } from "./monitoring-fixtures";

test("homepage renders", async ({ page }) => {
  await mockAnonymousSession(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await expect(page.locator("#conteudo")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("main h1").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("home keeps background controls inert during loading and marks the selected section", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Uses the visible desktop navigation.");
  await mockAnonymousSession(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const time = Date.now();
  await page.clock.install({ time });
  await page.clock.pauseAt(time + 1000);
  await page.goto("/");
  const preloader = page.locator(".site-preloader");
  await expect(preloader).toBeVisible();
  await page.clock.runFor(1000);
  const navigation = page.locator(".home-navigation");
  await expect(navigation).toBeAttached();
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest(".site-header, main")))).toBe(false);
  expect(await navigation.evaluate(node => Boolean(node.closest("[inert]")))).toBe(true);

  await page.clock.runFor(3200);
  await expect(preloader).toHaveCount(0);
  const project = navigation.getByRole("link", { name: "O projeto" });
  await project.click();
  await expect(page).toHaveURL(/#projeto$/);
  await expect(project).toHaveAttribute("aria-current", "location");
  await expect(navigation.getByRole("link", { name: "Início" })).not.toHaveAttribute("aria-current");
});

test("a filter drawer requested by URL waits until the preloader is gone", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Uses the desktop preloader coverage.");
  await mockMonitoring(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const time = Date.now();
  await page.clock.install({ time });
  await page.clock.pauseAt(time + 1000);
  await page.goto("/dashboard?filtros=historico");
  const preloader = page.locator(".site-preloader");
  await expect(preloader).toBeVisible();
  await page.clock.runFor(1000);
  const drawer = page.locator("#monitoring-filters");
  await expect(drawer).toBeAttached();
  await expect(drawer).toHaveJSProperty("open", false);
  await page.clock.runFor(3200);
  await expect(preloader).toHaveCount(0);
  await expect(drawer).toHaveJSProperty("open", true);
  await expect(drawer.getByRole("button", { name: "Fechar filtros" })).toBeFocused();
});

test("globe groups open with focus inside and Escape restores the marker", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Uses keyboard and a desktop map.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const billing = service();
  await mockMonitoring(page, snapshot({ services: [billing, { ...billing, id: "reports-api", name: "Reports API" }] }));
  await page.goto("/dashboard");
  const marker = page.locator(".globe-marker-cluster");
  await expect(marker).toBeVisible({ timeout: 15_000 });
  await marker.press("Enter");
  const popup = page.locator(".map-popup-card");
  await expect(popup.locator(".map-popup-close")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0);
  await expect(marker).toBeFocused();
});

test("map expansion stays disabled when WebGL is unavailable", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Exercises the dashboard beside the map.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value(this: HTMLCanvasElement, type: string, ...options: unknown[]) {
        return type.startsWith("webgl") ? null : Reflect.apply(getContext, this, [type, ...options]);
      },
    });
  });
  await mockMonitoring(page);
  await page.goto("/dashboard");
  await expect(page.getByText(/^Mapa indisponível/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Expandir visão do globo" })).toBeDisabled();
  await expect(page.locator(".monitoring-applications").getByText("Billing API", { exact: true })).toBeVisible();
});

test("evolution restarts replay from the end and describes an empty set accurately", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const reading = sample();
  const earlier = { ...reading, collectedAt: new Date(Date.parse(reading.collectedAt) - 90_000).toISOString() };
  await mockMonitoring(page, snapshot({ history: [earlier, reading] }));
  await page.goto("/dashboard?aba=evolucao");
  const timeline = page.getByRole("slider", { name: /^Explorar intervalos/ });
  await expect(timeline).toBeEnabled();
  await timeline.press("Home");
  await expect(page).toHaveURL(url => url.searchParams.has("cursor"));
  await expect(timeline).toHaveValue("0");
  await timeline.press("End");
  await expect(timeline).toHaveValue("3");
  await page.getByRole("button", { name: "Reproduzir histórico" }).click();
  await expect(timeline).toHaveValue("0");

  await mockMonitoring(page, snapshot({ history: [] }));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Nenhum registro neste período" })).toBeVisible();
  await page.getByRole("button", { name: "Sobre estimativas ambientais" }).click();
  await expect(page.getByText("Nenhuma amostra registrada neste período.")).toBeVisible();
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

test("history login preserves all selected applications and closing the drawer survives reload", async ({ page }) => {
  const billing = service();
  const reports = { ...billing, id: "reports-api", name: "Reports API" };
  await mockMonitoring(page, snapshot({ services: [billing, reports] }));
  const payload = Buffer.from(JSON.stringify({ email: "ui@example.test", sub: "1", role: "USER", exp: Math.floor(Date.now() / 1000) + 300 })).toString("base64url");
  const session = { tokenType: "Bearer", token: "header." + payload + ".signature" };
  let signedIn = false;
  await page.route("**/backend/auth/session", route => signedIn ? route.fulfill({ json: session }) : route.fulfill({ status: 401 }));
  await page.route("**/backend/auth/login", route => {
    signedIn = true;
    return route.fulfill({ json: session });
  });

  const selection = "aba=comparar&comparacao=ultima&app=billing-api&app=reports-api&faixa=billing-api&faixa=reports-api";
  await page.goto("/dashboard?" + selection);
  await page.getByRole("button", { name: /^Filtrar/ }).click({ timeout: 15_000 });
  await page.getByRole("link", { name: /Entrar para ver hist/ }).click();
  await page.getByLabel("E-mail").fill("ui@example.test");
  await page.getByLabel("Senha", { exact: true }).fill("example-password");
  await page.getByRole("button", { name: "Entrar no ambiente" }).click();

  const drawer = page.locator("#monitoring-filters");
  await expect(drawer).toBeVisible({ timeout: 15_000 });
  await expect(page).toHaveURL(url => url.search === "?" + selection + "&filtros=historico");
  await drawer.getByRole("button", { name: "Ver resultados" }).click();
  await expect(drawer).toHaveCount(0);
  await expect(page).toHaveURL(url => url.search === "?" + selection);
  await expect(page.getByRole("heading", { name: "Comparar aplicações" })).toBeVisible();

  await page.reload();
  const filters = page.getByRole("button", { name: /^Filtrar/ });
  await expect(filters).toHaveAttribute("aria-expanded", "false", { timeout: 15_000 });
  await expect(drawer).toHaveCount(0);
});

test("revoked history session offers sign-in while the public dashboard stays available", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockMonitoring(page);
  const payload = Buffer.from(JSON.stringify({ email: "ui@example.test", sub: "1", role: "USER", exp: Math.floor(Date.now() / 1000) + 300 })).toString("base64url");
  await page.route("**/backend/auth/session", route => route.fulfill({ json: { tokenType: "Bearer", token: "header." + payload + ".signature" } }));
  let protectedRequests = 0;
  await page.route("**/backend/api/monitoring?*", route => {
    if (new URL(route.request().url()).searchParams.get("view") !== "history") return route.fallback();
    protectedRequests++;
    return route.fulfill({ status: 401, json: { message: "Sessão inválida" } });
  });
  await page.goto("/dashboard?filtros=historico");
  const drawer = page.locator("#monitoring-filters");
  await expect.poll(() => protectedRequests, { timeout: 15_000 }).toBe(1);
  await expect(drawer.getByRole("link", { name: /Entrar para ver hist/ })).toBeVisible();
  await expect(drawer.getByRole("button", { name: "Tentar novamente" })).toHaveCount(0);
  await drawer.getByRole("button", { name: "Ver resultados" }).click();
  await expect(page.locator(".monitoring-applications").getByText("Billing API", { exact: true })).toBeVisible();
});

test("comparison identifies partial emissions in the table and chart", async ({ page }, info) => {
  const billing = service();
  const reports = { ...billing, id: "reports-api", name: "Reports API" };
  const reading = sample();
  await mockMonitoring(page, snapshot({
    services: [billing, reports],
    history: [
      { ...reading, sampleCount: 2, emissionCount: 1 },
      { ...reading, serviceId: reports.id, sampleCount: 2, emissionCount: 2 },
    ],
  }));
  await page.goto("/dashboard?aba=comparar&app=billing-api&app=reports-api");
  const table = page.locator(info.project.name === "mobile" ? ".comparison-mobile-table" : ".comparison-desktop-table");
  await expect(table.getByText("· Parcial (1 de 2 amostras)", { exact: true })).toBeVisible();
  await expect(page.getByText("Emissões parciais: Billing API (1 de 2 amostras).")).toBeVisible();
});

test("returning from an application restores keyboard focus even if its row is missing", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockMonitoring(page);
  await page.goto("/dashboard?servico=not-found");
  await expect(page.getByRole("heading", { name: "Aplicação não encontrada" })).toBeVisible({ timeout: 15_000 });
  await page.locator(".monitoring-back").press("Enter");
  await expect(page.getByRole("heading", { name: "Monitoramento", exact: true })).toBeFocused();
  const application = page.getByRole("button", { name: "Brasil Billing API", exact: true });
  await application.press("Enter");
  await expect(page.getByRole("heading", { name: "Billing API", exact: true })).toBeFocused();
  await page.locator(".monitoring-back").press("Enter");
  await expect(application).toBeFocused();
});

test("history return preserves Values and retries a failed history request inside the drawer", async ({ page }) => {
  await mockMonitoring(page);
  let historyAttempts = 0;
  await page.route("**/backend/api/monitoring?*", route => {
    if (new URL(route.request().url()).searchParams.get("view") !== "history") return route.fallback();
    if (++historyAttempts === 1) return route.fulfill({ status: 503, json: { error: "Unavailable" } });
    return route.fulfill({ json: snapshot() });
  });
  await page.goto("/dashboard?servico=billing-api&detalhe=evolucao&painel=coletas");
  const values = page.getByRole("tab", { name: "Valores", exact: true });
  await expect(values).toHaveAttribute("aria-selected", "true", { timeout: 15_000 });
  await page.getByRole("button", { name: /^Filtrar/ }).click();
  const login = page.getByRole("link", { name: /Entrar para ver hist/ });
  const href = await login.getAttribute("href");
  const target = new URL(new URL(href!, page.url()).searchParams.get("retorno")!, page.url());
  expect(target.searchParams.get("painel")).toBe("coletas");
  expect(target.searchParams.get("filtros")).toBe("historico");

  const payload = Buffer.from(JSON.stringify({ email: "ui@example.test", sub: "1", role: "USER", exp: Math.floor(Date.now() / 1000) + 300 })).toString("base64url");
  await page.route("**/backend/auth/session", route => route.fulfill({ json: { tokenType: "Bearer", token: "header." + payload + ".signature" } }));
  await page.goto(target.href);
  const drawer = page.locator("#monitoring-filters");
  const retry = drawer.getByRole("button", { name: "Tentar novamente" });
  await expect(retry).toBeVisible({ timeout: 15_000 });
  await retry.click();
  await expect.poll(() => historyAttempts).toBe(2);
  await expect(retry).toHaveCount(0);
  await drawer.getByRole("button", { name: "Ver resultados" }).click();
  await expect(values).toHaveAttribute("aria-selected", "true");
  await expect(page).toHaveURL(url => url.searchParams.get("painel") === "coletas" && !url.searchParams.has("filtros"));
});
