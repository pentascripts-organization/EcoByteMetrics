import { test, expect, apiService, apiMetrics, backendServices } from './fixtures';
import { getAnalysis } from '../src/utils/analysis';
import { getTestSnapshot } from './data/monitoring';

test('24 hours, 7 days and 30 days select different historical observations', () => {
  const snapshot = getTestSnapshot('30d');
  snapshot.lastCollectionAt = '2026-10-13T12:00:00Z';
  snapshot.history = [
    { serviceId: 'demo-br', collectedAt: '2026-10-03T12:00:00Z', energyKwh: 1, emissionsG: 85 },
    { serviceId: 'demo-br', collectedAt: '2026-10-11T12:00:00Z', energyKwh: 2, emissionsG: 170 },
    { serviceId: 'demo-br', collectedAt: '2026-10-13T12:00:00Z', energyKwh: 3, emissionsG: 255 },
  ];
  expect(getAnalysis(snapshot, '24h', '').totals.energyKwh).toBe(3);
  expect(getAnalysis(snapshot, '7d', '').totals.energyKwh).toBe(5);
  expect(getAnalysis(snapshot, '30d', '').totals.energyKwh).toBe(6);
  expect(getAnalysis(snapshot, '7d', '?ate=2026-10-04T12:00').history).toHaveLength(1);
});

test('period changes refresh resources, preserve location and explain limited history', async ({ page }) => {
  let calls = 0;
  let cpu = 50;
  await page.route('**/backend/services', route => { calls++; return route.fulfill({ json: backendServices([apiService]) }); });
  await page.route('https://metrics.unilaunch.org/**', route => route.fulfill({ json: { ...apiMetrics, metrics: { ...apiMetrics.metrics, cpu_percent: cpu } } }));
  await page.goto('/servicos?regiao=br-sudeste');
  await expect(page.locator('tbody tr').first()).toContainText('50%');
  const select = page.getByLabel('Período de análise');
  cpu = 80;
  await select.selectOption('24h');
  await expect(select).toHaveValue('24h');
  await expect.poll(() => calls).toBe(2);
  await expect(page.locator('tbody tr').first()).toContainText('80%');
  await expect(page.locator('.period-coverage')).toContainText('Últimas 24 horas');
  await expect(page.locator('.period-coverage')).toContainText('diferentes períodos podem mostrar os mesmos registros');
  expect(new URL(page.url()).searchParams.get('regiao')).toBe('br-sudeste');
  cpu = 90;
  await select.selectOption('30d');
  await expect(select).toHaveValue('30d');
  await expect.poll(() => calls).toBe(3);
  await expect(page.locator('tbody tr').first()).toContainText('90%');
  await expect(page.locator('.period-coverage')).toContainText('Últimos 30 dias');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
