import { expect, test } from './fixtures';
import { countries, findCountry, getCities } from '../src/data/geography';
import { getDemoSnapshot } from '../src/services/demo';

test('geographic catalogue matches names and uses registered regions only', () => {
  expect(countries).toHaveLength(177);
  expect(new Set(countries.map((country) => country.properties.code)).size).toBe(countries.length);
  expect(findCountry(' brazil ')?.properties.code).toBe('BR');
  expect(findCountry('franca')?.properties.code).toBe('FR');
  expect(findCountry('United States')?.properties.code).toBe('US');
  expect(findCountry('Irlanda')?.properties.code).toBe('IE');
  expect(findCountry('País inexistente')).toBeUndefined();
  const demo = getDemoSnapshot('7d');
  const cities = getCities('BR', demo.regions);
  expect(cities.map(city => city.name)).toEqual(['São Paulo']);
  expect(cities[0].latitude).toBe(demo.regions[0].latitude);
  expect(getCities('US', demo.regions)).toEqual([]);
  expect(cities.every((city) => city.countryCode === 'BR')).toBe(true);
});

test('globe country and city selection drives the CO2 query and resets in order', async ({ page }, testInfo) => {
  test.slow();
  if (testInfo.project.name === 'mobile') await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/pesquisa');
  await expect(page.getByLabel('Cidade', { exact: true })).toBeDisabled();
  await page.locator('.globe-stage[data-ready="true"]').waitFor();
  await page.getByLabel('Usar dados de demonstração').check();
  const canvas = page.locator('.globe-stage canvas');
  await canvas.scrollIntoViewIfNeeded();
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  const countryPoint = { x: bounds!.width / 2 - bounds!.height * 0.1, y: bounds!.height * 0.63 };
  if (testInfo.project.name === 'mobile') await canvas.tap({ position: countryPoint });
  else {
    await expect.poll(async () => {
      await page.mouse.move(bounds!.x + countryPoint.x + 1, bounds!.y + countryPoint.y);
      await page.mouse.move(bounds!.x + countryPoint.x, bounds!.y + countryPoint.y);
      return page.locator('.globe-hover').textContent().catch(() => '');
    }).toBe('Brasil');
    await canvas.click({ position: countryPoint });
  }
  await expect(page.getByLabel('País', { exact: true })).toHaveValue('Brasil');
  await expect(page.getByLabel('Cidade', { exact: true })).toBeEnabled();
  await expect(page.locator('.region-map')).toHaveAttribute('data-country', 'BR');
  if (testInfo.project.name === 'desktop') {
    const cityPoint = { x: bounds!.x + bounds!.width / 2 + bounds!.height * 0.12, y: bounds!.y + bounds!.height * 0.667 };
    await expect.poll(async () => {
      await page.mouse.move(cityPoint.x + 1, cityPoint.y);
      await page.mouse.move(cityPoint.x, cityPoint.y);
      return page.locator('.globe-hover').textContent().catch(() => '');
    }).toBe('São Paulo');
    await canvas.click({ position: { x: cityPoint.x - bounds!.x, y: cityPoint.y - bounds!.y } });
  } else {
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await canvas.tap({ position: { x: bounds!.width / 2 + bounds!.height * 0.12, y: bounds!.height * 0.667 } });
  }
  await expect(page.getByLabel('Cidade', { exact: true }).locator('option:checked')).toHaveText('São Paulo');
  await expect(page.locator('.globe-cities button.active')).toHaveText('São Paulo');
  await page.getByRole('button', { name: 'Aproximar globo' }).click();
  await page.getByRole('button', { name: 'Afastar globo' }).click();
  await page.screenshot({ path: testInfo.outputPath('interactive-globe.png'), fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\?.*cidade=S%C3%A3o\+Paulo/);
  await expect(page.locator('.metric-value').first()).not.toHaveText('—gCO₂e');
  await page.getByRole('link', { name: 'Pesquisar outra região' }).click();
  await page.getByLabel('País', { exact: true }).fill('Japão');
  await page.getByRole('button', { name: 'Tóquio', exact: true }).click();
  await page.getByLabel('País', { exact: true }).fill('França');
  await expect(page.getByLabel('Cidade', { exact: true })).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Tóquio', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Paris', exact: true }).click();
  await page.getByRole('button', { name: 'Ver o mundo', exact: true }).click();
  await expect(page.getByLabel('País', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Cidade', { exact: true })).toBeDisabled();
});

test('country and city fields remain usable when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto('/pesquisa');
  await expect(page.getByText('A visualização 3D não está disponível neste navegador. Continue pelos campos de país e cidade.')).toBeVisible({ timeout: 15_000 });
  await page.getByLabel('Usar dados de demonstração').check();
  await page.getByLabel('País', { exact: true }).fill('Brasil');
  await page.getByRole('button', { name: 'São Paulo', exact: true }).click();
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\?/);
  await expect(page.locator('.metric-value').first()).not.toHaveText('—gCO₂e');
});
