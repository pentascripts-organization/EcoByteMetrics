import { test, expect, apiService, apiRegions, apiMetrics, backendServices } from './fixtures';
import { getAnalysis, analysisLink } from '../src/utils/analysis';
import { getDemoSnapshot } from '../src/services/demo';

async function mockServices(page: import('@playwright/test').Page, count = 1) {
  const services = Array.from({ length: count }, (_, index) => ({ ...apiService, id: 'service-' + index, name: 'Service ' + index }));
  await page.route('**/backend/services', route => route.fulfill({ json: backendServices(services) }));
  await page.route('https://metrics.unilaunch.org/**', route => route.fulfill({ json: apiMetrics }));
}

test('historical dates anchor the entire period and use the location recorded at collection time', () => {
  const snapshot = getDemoSnapshot('30d');
  const oldPoint = { ...snapshot.history[0]!, serviceId: 'moved-service', regionCode: 'old-region', country: 'Brasil', city: 'São Paulo' };
  snapshot.history = [oldPoint, ...snapshot.history.slice(1)];
  expect(getAnalysis(snapshot, '24h', '?ate=2026-10-08T23:59&regiao=old-region').history).toEqual([oldPoint]);
  expect(getAnalysis(snapshot, '24h', '?regiao=old-region').history).toEqual([]);
  expect(getAnalysis(snapshot, '7d', '?ate=bad').invalidDate).toBe(true);
  expect(getAnalysis(snapshot, '7d', '?ate=bad').history).toEqual([]);
  expect(analysisLink('/energia', '?pais=Brasil&periodo=24h&ate=2026-10-08T23:59&servico=demo-br')).toBe('/energia?pais=Brasil&periodo=24h&ate=2026-10-08T23%3A59');
});

test('region, period and date survive navigation; services and map open the same service detail', async ({ page }, testInfo) => {
  await mockServices(page);
  await page.goto('/dashboard?pais=Brasil&cidade=S%C3%A3o+Paulo&regiao=br-sudeste&periodo=24h');
  await expect(page.locator('.metric-value').first()).not.toHaveText('—gCO₂e');
  await page.getByLabel('Selecionar data e hora', { exact: true }).fill('2026-10-08T23:59');
  const nav = page.getByRole('navigation', { name: testInfo.project.name === 'mobile' ? 'Navegação móvel' : 'Navegação principal' });
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Abrir navegação' }).click();
  await nav.getByRole('link', { name: 'Emissões', exact: true }).click();
  const query = new URL(page.url()).searchParams;
  expect(query.get('regiao')).toBe('br-sudeste');
  expect(query.get('periodo')).toBe('24h');
  expect(query.get('ate')).toBe('2026-10-08T23:59');
  await expect(page.locator('.metric-value').first()).toHaveText('—gCO₂e');
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Abrir navegação' }).click();
  await nav.getByRole('link', { name: 'Serviços', exact: true }).click();
  await page.getByRole('link', { name: 'Service 0', exact: true }).click();
  await expect(page).toHaveURL(/\/servicos\/service-0\?/);
  await expect(page.locator('h1')).toHaveText('Service 0');
  await page.getByRole('link', { name: 'Voltar aos serviços', exact: true }).click();
  await page.getByLabel('Buscar serviço ou região', { exact: true }).fill('Service 0');
  await page.getByRole('combobox', { name: 'Filtrar por estado', exact: true }).selectOption('available');
  await page.getByRole('combobox', { name: 'Ordenar serviços', exact: true }).selectOption('energy');
  await page.getByRole('link', { name: 'Service 0', exact: true }).click();
  await page.getByRole('link', { name: 'Voltar aos serviços', exact: true }).click();
  await expect(page.getByLabel('Buscar serviço ou região', { exact: true })).toHaveValue('Service 0');
  await expect(page.getByRole('combobox', { name: 'Filtrar por estado', exact: true })).toHaveValue('available');
  await expect(page.getByRole('combobox', { name: 'Ordenar serviços', exact: true })).toHaveValue('energy');
  await page.getByRole('link', { name: 'Service 0', exact: true }).click();
  expect(new URL(page.url()).searchParams.get('ate')).toBe('2026-10-08T23:59');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Abrir navegação' }).click();
  await nav.getByRole('link', { name: 'Visão geral', exact: true }).click();
  await page.getByRole('button', { name: 'Voltar para agora', exact: true }).click();
  await page.locator('.globe-cities[aria-label="Serviços no mapa"]').getByRole('button', { name: 'Service 0', exact: true }).click();
  await expect(page).toHaveURL(/\/servicos\/service-0\?/);
});

test('switching the data source clears stale comparison selections and allows new ones', async ({ page }) => {
  await mockServices(page, 4);
  await page.goto('/comparar');
  const add = page.getByLabel('Adicionar serviço à comparação');
  for (let index = 0; index < 4; index++) await add.selectOption('service-' + index);
  await expect(add).toBeDisabled();
  await page.getByLabel('Usar dados de demonstração').check();
  await expect(page.locator('.selected-services')).toHaveCount(0);
  await expect(add).toBeEnabled();
  await add.selectOption('demo-br');
  await add.selectOption('demo-jp');
  await expect(page.locator('.selected-services')).toContainText('Aplicação Brasil');
  await page.reload();
  // Demonstration is session-only; its IDs never block the live selection.
  await expect(add).toBeEnabled();
  await add.selectOption('service-0');
  await expect(page.locator('.selected-services')).toContainText('Service 0');
});

test('leaving a pending regional search cannot navigate away from the next page', async ({ page }, testInfo) => {
  await mockServices(page);
  await page.goto('/pesquisa');
  await page.getByLabel('País', { exact: true }).fill('Brasil');
  await page.getByLabel('Cidade', { exact: true }).selectOption('br-sudeste');
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let pending = false;
  await page.route('**/backend/services', async route => {
    pending = true;
    await gate;
    await route.fulfill({ json: backendServices([{ ...apiService, id: 'service-0', name: 'Service 0' }]) }).catch(() => {});
  });
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect.poll(() => pending).toBe(true);
  await page.locator('a[aria-label="Configurações"]').click();
  await expect(page).toHaveURL(/\/configuracoes\?/);
  release();
  await expect(page.locator('h1')).toHaveText('Pequenos ajustes. Mais conforto.');
  await expect(page.getByRole('button', { name: 'Salvar preferências', exact: true })).toBeDisabled();
  // Re-enter monitoring: a cancelled request must not leave refresh permanently disabled.
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Abrir navegação' }).click();
  await page.getByRole('navigation', { name: testInfo.project.name === 'mobile' ? 'Navegação móvel' : 'Navegação principal' }).getByRole('link', { name: 'Visão geral', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Atualizar indicadores', exact: true })).toBeEnabled();
});

test('administration records actual requests and can clear the local diagnostic list', async ({ page }) => {
  await mockServices(page);
  await page.goto('/gerenciamento');
  await page.getByRole('button', { name: 'Requisições da API', exact: true }).click();
  await expect(page.getByText('Nenhuma requisição registrada')).toBeVisible();
  await page.getByRole('button', { name: 'Consultar agora', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Consultar agora', exact: true })).toBeEnabled();
  await expect(page.locator('.admin-content table tbody tr')).toHaveCount(3);
  await expect(page.locator('.admin-content table')).toContainText('HTTP 200');
  await page.getByRole('button', { name: 'Limpar registros locais', exact: true }).click();
  await expect(page.getByText('Nenhuma requisição registrada')).toBeVisible();
});

test('a service detail simulates emissions in another region without making a mutation request', async ({ page }) => {
  await mockServices(page);
  const mutations: string[] = [];
  page.on('request', request => { if (!['GET', 'HEAD'].includes(request.method())) mutations.push(request.url()); });
  await page.goto('/servicos/service-0');
  await expect(page.locator('h1')).toHaveText('Service 0');
  await page.getByLabel('Região de destino', { exact: true }).selectOption('us-east');
  const energy = (50 + 2 * .375 + 10 * .01 + 1 * .02) / 60 / 1000;
  const projected = await page.locator('.simulation-results div').filter({ hasText: 'Emissões simuladas por coleta' }).locator('dd').innerText();
  const { formatNumber } = await import('../src/utils/format');
  expect(projected).toBe(formatNumber(energy * apiRegions[1]!.carbon_intensity_gco2e_per_kwh) + ' gCO₂e');
  expect(mutations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('unsaved local preferences can be discarded and an initial 404 has a useful fallback', async ({ page }) => {
  await page.goto('/configuracoes');
  await page.getByLabel('Folhas em movimento').uncheck();
  await expect(page.getByRole('status')).toContainText('ainda não salvas');
  await page.getByRole('button', { name: 'Descartar alterações', exact: true }).click();
  await expect(page.getByLabel('Folhas em movimento')).toBeChecked();
  await expect(page.getByRole('button', { name: 'Salvar preferências', exact: true })).toBeDisabled();
  await page.goto('/invalid-start');
  await page.getByRole('button', { name: 'Voltar à página anterior', exact: true }).click();
  await expect(page).toHaveURL(/\/pesquisa$/);
});
