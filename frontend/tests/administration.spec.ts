import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { attachEvidence, mockMonitoring, snapshot } from "./monitoring-fixtures";

const route = "/dashboard?aba=administracao";
const email = "admin@example.test";
const account = { id_user: 7, name_user: "Conta de teste", email_user: email };

function token(role: "ADMIN" | "USER", address = email) {
  const payload = Buffer.from(JSON.stringify({ email: address, sub: "7", role, exp: Math.floor(Date.now() / 1000) + 300 })).toString("base64url");
  return { tokenType: "Bearer", token: "header." + payload + ".signature" };
}

async function session(page: Page, role: "ADMIN" | "USER") {
  await page.route("**/backend/auth/session", request => request.fulfill({ json: token(role) }));
}

test.use({ reducedMotion: "reduce" });

test("administration loads account, settings and live services with responsive cards", async ({ page }, info) => {
  await mockMonitoring(page);
  await session(page, "ADMIN");
  await page.route("**/backend/api/monitoring-settings", request => request.fulfill({
    json: { collectionIntervalSeconds: 45, discovery: "automatic", editable: false },
  }));
  await page.goto(route);
  await expect(page.getByRole("region", { name: "Minha conta" }).getByText("ADMIN", { exact: true })).toBeVisible();
  await expect(page.getByText("45 segundos")).toBeVisible({ timeout: 15_000 });
  if (info.project.name === "mobile") {
    const entry = page.locator(".administration-service-list details").filter({ hasText: "Billing API" });
    const toggle = entry.locator("summary");
    await expect(toggle.getByText("Disponível", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(entry.getByText("Última coleta", { exact: true })).toBeHidden();
    await toggle.tap();
    await expect(entry.getByText("Última coleta", { exact: true })).toBeVisible();
    await expect(entry.getByText(/Paulo/)).toBeVisible();
    await toggle.tap();
    await expect(entry.getByText("Última coleta", { exact: true })).toBeHidden();
  } else {
    await expect(page.getByRole("rowheader", { name: "Billing API" })).toBeVisible({ timeout: 15_000 });
  }
  const future = page.getByRole("region", { name: "Recursos futuros" });
  await expect(future.getByText("Indisponível", { exact: true })).toHaveCount(3);
  await expect(future.getByRole("button")).toHaveCount(0);
  if (info.project.name === "desktop") {
    for (const width of [1672, 1280, 768, 390]) {
      await page.setViewportSize({ width, height: 941 });
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
      await attachEvidence(page, "administracao-" + width);
    }
  }
});

test("user edits only their own account and the session renews before logout", async ({ page }) => {
  await mockMonitoring(page);
  await session(page, "USER");
  await page.route("**/backend/api/monitoring-settings", request => request.fulfill({
    json: { collectionIntervalSeconds: 30, discovery: "automatic", editable: false },
  }));
  let updates = 0;
  await page.route("**/backend/api/users/7", request => {
    if (request.request().method() === "GET") return request.fulfill({ json: account });
    expect(request.request().postDataJSON()).toEqual({ name_user: account.name_user, email_user: "updated@example.test", password_user: "example-password" });
    return ++updates === 1 ? request.fulfill({ status: 409, json: {} }) : request.fulfill({ json: { ...account, email_user: "updated@example.test" } });
  });
  await page.route("**/backend/auth/login", request => request.fulfill({ json: token("USER", "updated@example.test") }));
  await page.route("**/backend/auth/logout", request => request.fulfill({ json: { loggedOut: true } }));
  await page.goto(route);
  const card = page.getByRole("region", { name: "Minha conta" });
  await expect(card.getByText("USER", { exact: true })).toBeVisible();
  await card.getByRole("button", { name: "Editar conta" }).click();
  const dialog = page.getByRole("dialog", { name: "Editar conta" });
  const password = dialog.locator('input[name="password"]');
  await expect(password).toHaveValue("");
  await dialog.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(password).toHaveAttribute("aria-invalid", "true");
  await dialog.locator('input[name="email"]').fill("updated@example.test");
  await password.fill("example-password");
  await dialog.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(dialog.getByText("Este e-mail já está em uso.")).toBeVisible();
  await password.fill("example-password");
  await dialog.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(card.getByText("updated@example.test", { exact: true })).toBeVisible();
  await expect(card.getByText("Conta atualizada com sucesso.")).toBeVisible();
  await card.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(url => !url.searchParams.has("aba"));
});

test("administration handles empty services, settings failure and an expired session", async ({ page }) => {
  await mockMonitoring(page, snapshot({ services: [], history: [] }));
  await session(page, "ADMIN");
  let expired = false;
  await page.route("**/backend/api/monitoring-settings", request => request.fulfill({ status: expired ? 401 : 503, json: {} }));
  await page.route("**/backend/api/monitoring?*", request => request.fulfill({ status: 503, json: {} }));
  await page.goto(route);
  const services = page.getByRole("region", { name: "Serviços monitorados", exact: true });
  await expect(services.getByRole("alert")).toHaveText("Não foi possível consultar os serviços.");
  await page.unroute("**/backend/api/monitoring?*");
  await mockMonitoring(page, snapshot({ services: [], history: [] }));
  await services.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByText("Nenhum serviço monitorado.")).toBeVisible({ timeout: 15_000 });
  const settings = page.getByRole("region", { name: "Configuração da coleta" });
  await expect(settings.getByRole("alert")).toBeVisible();
  expired = true;
  await settings.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page).toHaveURL(/motivo=expirada/);
});
