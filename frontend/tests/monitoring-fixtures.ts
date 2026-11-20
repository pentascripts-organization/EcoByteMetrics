import { test, type Page } from "@playwright/test";

export const monitoringEndpoint = /\/backend\/api\/monitoring(?:\?|$)/;

export function snapshot({
  services = [service()],
  history = [sample()],
}: {
  services?: ReturnType<typeof service>[];
  history?: ReturnType<typeof sample>[];
} = {}) {
  const lastCollectionAt = services[0]?.lastCollectionAt ?? null;
  return {
    source: "database",
    services,
    regions: [],
    history,
    observations: [],
    historyPeriod: "7d",
    historyUntil: new Date().toISOString(),
    historyIncluded: true,
    selectedAt: null,
    lastCollectionAt,
    discoveryUpdatedAt: new Date().toISOString(),
  };
}

export function service({
  emissionsG = 1,
  lastCollectionAt = new Date().toISOString(),
}: { emissionsG?: number | null; lastCollectionAt?: string } = {}) {
  return {
    id: "billing-api",
    name: "Billing API",
    status: "available",
    country: "Brazil",
    region: "Sudeste",
    regionCode: "br-sp",
    city: "Sao Paulo",
    latitude: -23.55,
    longitude: -46.63,
    cpuPercent: 25,
    memoryGb: 2,
    diskGb: 4,
    networkGb: 1,
    energyKwh: 0.002,
    emissionsG,
    carbonIntensity: emissionsG === null ? null : 500,
    renewablePercent: 70,
    collectionIntervalSeconds: 30,
    lastCollectionAt,
  };
}

export function sample({
  emissionsG = 1,
}: { emissionsG?: number | null } = {}) {
  return {
    serviceId: "billing-api",
    regionCode: "br-sp",
    country: "Brazil",
    city: "Sao Paulo",
    collectedAt: new Date().toISOString(),
    energyKwh: 0.002,
    emissionsG,
    intervalSeconds: 30,
    sampleCount: 1,
    emissionCount: emissionsG === null ? 0 : 1,
    bucketSeconds: 30,
  };
}

export async function mockAnonymousSession(page: Page) {
  await page.route("**/backend/auth/session", route => route.fulfill({ status: 401 }));
}

export async function mockMonitoring(page: Page, data = snapshot()) {
  await mockAnonymousSession(page);
  await page.route(monitoringEndpoint, route => {
    const latest = new URL(route.request().url()).searchParams.get("view") === "latest";
    return route.fulfill({
      json: latest ? { ...data, history: [], observations: [], historyIncluded: false } : data,
    });
  });
}

export async function attachEvidence(page: Page, name: string) {
  const path = test.info().outputPath(`${name}-${test.info().project.name}.png`);
  await page.screenshot({ path, animations: "disabled", fullPage: true });
  await test.info().attach(name, {
    path,
    contentType: "image/png",
  });
}
