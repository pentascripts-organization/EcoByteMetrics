import { test, expect, apiMetrics, apiRegions } from './fixtures';
import { getRegionIssues } from '../src/utils/region';
import { getDemoSnapshot } from '../src/services/demo';

const japan = { id: 'audit-stream', name: 'Audit Stream', location: { ...apiRegions[4], region_code: 'jp-east' } };

test('alert reasons identify missing fields and ignore healthy or removed services', () => {
  const services = getDemoSnapshot('7d').services;
  expect(getRegionIssues([services[0]])).toEqual([]);
  expect(getRegionIssues([{ ...services[2], status: 'removed' }])).toEqual([]);
  expect(getRegionIssues([services[2]])).toEqual(['Aplicação Japão: Métricas ausentes ou inválidas: memória RAM, disco, rede.']);
  expect(getRegionIssues([{ ...services[0], emissionsG: null, statusMessage: 'Fator de carbono não disponível para br-sudeste.' }])).toEqual(['Aplicação Brasil: Fator de carbono não disponível para br-sudeste.']);
});

test('Tokyo demonstration alert offers a direct switch to real APIs', async ({ page }) => {
  await page.route('https://metrics.unilaunch.org/**', (route) => route.fulfill({ json: route.request().url().endsWith('/services') ? [japan] : apiMetrics }));
  await page.goto('/pesquisa');
  await page.getByLabel('Usar dados de demonstração').check();
  await page.getByLabel('País', { exact: true }).fill('Japão');
  await page.getByLabel('Cidade', { exact: true }).selectOption('demo-jp');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('SIMULAÇÃO · MODO DEMONSTRAÇÃO');
  await expect(dialog).toContainText('Aplicação Japão');
  await expect(dialog).toContainText('memória RAM, disco, rede');
  await page.getByRole('button', { name: 'Consultar APIs reais', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByLabel('Usar dados de demonstração')).not.toBeChecked();
  await expect(page.getByLabel('Cidade', { exact: true })).toHaveValue('jp-east');
  await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page).toHaveURL(/regiao=jp-east/);
  await expect(page.locator('.metric-value').first()).not.toHaveText('—gCO₂e');
});

test('real partial metrics show the failing field and can be retried', async ({ page }, testInfo) => {
  let missing = true;
  await page.route('https://metrics.unilaunch.org/**', (route) => route.fulfill({ json: route.request().url().endsWith('/services') ? [japan] : { ...apiMetrics, metrics: { ...apiMetrics.metrics, memory_gb: missing ? null : 2 } } }));
  await page.goto('/pesquisa');
  await page.getByLabel('País', { exact: true }).fill('Japão');
  await page.getByLabel('Cidade', { exact: true }).selectOption('jp-east');
  await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Dados das APIs do desafio');
  await expect(dialog).toContainText('Audit Stream: Métricas ausentes ou inválidas: memória RAM.');
  await expect(dialog).not.toContainText('SIMULAÇÃO');
  await expect(page.getByRole('button', { name: 'Consultar APIs reais', exact: true })).toHaveCount(0);
  await dialog.screenshot({ path: testInfo.outputPath('real-alert.png') });
  missing = false;
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(page).toHaveURL(/regiao=jp-east/);
  await expect(page.locator('.metric-value').first()).not.toHaveText('—gCO₂e');
});
