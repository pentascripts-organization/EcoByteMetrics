import { test, expect, apiMetrics, apiRegions } from './fixtures';
import { matchesRegion } from '../src/utils/region';
import { findCountry, localizeCity } from '../src/data/geography';

test('regional matching accepts API names, translations and country aliases', () => {
  expect(matchesRegion({ country: null, city: null }, 'Canadá', 'Toronto')).toBe(false);
  for (const region of apiRegions) {
    const place = { country: findCountry(region.country)!.properties.name, city: localizeCity(region.country, region.city) };
    expect(matchesRegion(place, region.country, region.city)).toBe(true);
    expect(matchesRegion(place, region.country, 'Jacareí')).toBe(false);
  }
  expect(matchesRegion({ country: 'República da Irlanda', city: 'Dublin' }, 'Irlanda', 'Dublin')).toBe(true);
  for (const country of ['EUA', 'USA', 'Estados Unidos da América']) {
    expect(matchesRegion({ country: 'Estados Unidos', city: 'Ashburn' }, country, 'Ashburn')).toBe(true);
  }
});

test('every API country and city opens its own regional dashboard', async ({ page }) => {
  test.slow();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('https://metrics.unilaunch.org/**', (route) => route.fulfill({ json: route.request().url().endsWith('/services') ? apiRegions.map((region) => ({ id: region.code, name: region.code, location: { ...region, region_code: region.code } })) : apiMetrics }));
  for (const region of apiRegions) {
    await page.goto('/pesquisa');
    await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeEnabled();
    await page.getByLabel('País', { exact: true }).fill(region.country);
    const city = page.getByLabel('Cidade', { exact: true });
    await expect(city).toHaveJSProperty('tagName', 'SELECT');
    await expect(city).toHaveValue('');
    await expect(city.locator('option')).toHaveCount(2);
    await expect(city).not.toContainText('Jacareí');
    await city.selectOption(region.code);
    await expect(page.getByRole('link', { name: 'Ir para o Dashboard', exact: true })).toHaveAttribute('href', new RegExp(`regiao=${region.code}`));
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`regiao=${region.code}`));
    await expect(page.locator('.region-factor-panel tbody')).toContainText(region.code);
    await expect(page.locator('.renewable-summary')).toContainText(`${region.renewable_share_percent}%`);
    await expect(page.locator('.metric-value').first()).not.toHaveText('—gCO₂e');
    await expect(page.locator('.globe-cities button.active')).toHaveCount(1);
  }
});

test('direct dashboard links keep translated regional selections without a region code', async ({ page }) => {
  test.slow();
  await page.route('https://metrics.unilaunch.org/**', (route) => route.fulfill({ json: route.request().url().endsWith('/services') ? apiRegions.map((region) => ({ id: region.code, name: region.code, location: { ...region, region_code: region.code } })) : apiMetrics }));
  for (const region of apiRegions.slice(1)) {
    const country = region.code === 'eu-west' ? 'Irlanda' : region.code === 'us-east' ? 'EUA' : region.country;
    await page.goto(`/dashboard?${new URLSearchParams({ pais: country, cidade: region.city })}`);
    await expect(page.locator('.region-factor-panel tbody')).toContainText(region.code);
    await expect(page.locator('.metric-value').first()).not.toHaveText('—gCO₂e');
    await expect(page.locator('.globe-cities button.active')).toHaveCount(1);
    await expect(page.locator('.region-factor-panel tbody tr')).toHaveCount(1);
  }
});
