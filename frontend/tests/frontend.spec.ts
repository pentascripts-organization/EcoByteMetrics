import { expect, test } from '@playwright/test';

test('all screens load directly without JS errors or horizontal overflow', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const path of ['/', '/dashboard', '/servicos', '/emissoes', '/energia', '/comparar', '/login', '/configuracoes']) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (path === '/' || path === '/dashboard' || path === '/login') {
      await page.screenshot({ path: testInfo.outputPath(`${path === '/' ? 'home' : path.slice(1)}.png`), fullPage: true, animations: 'disabled' });
    }
  }
  expect(errors).toEqual([]);
});

test('dashboard does not invent measurements or collection timestamps', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('Aguardando a primeira coleta')).toBeVisible();
  await expect(page.locator('.metric-value').nth(0)).toHaveText('—gCO₂e');
  await expect(page.locator('.metric-value').nth(1)).toHaveText('—kWh');
  await expect(page.locator('.metric-value').nth(2)).toHaveText('0');
  await expect(page.locator('.metric-value').nth(3)).toHaveText('—');
  await page.getByRole('combobox', { name: 'Período de análise' }).selectOption('30d');
  await page.getByRole('button', { name: 'Atualizar indicadores' }).click();
  await expect(page.getByText('Aguardando a primeira coleta')).toBeVisible();
  await expect(page.getByText('Seu histórico começa aqui')).toBeVisible();
});

test('preferences persist and change the period and leaf motion', async ({ page }) => {
  await page.goto('/configuracoes');
  await page.getByLabel('Folhas em movimento').uncheck();
  await page.getByLabel('Período padrão').selectOption('30d');
  await page.getByRole('button', { name: 'Salvar preferências' }).click();
  await expect(page.getByRole('status')).toContainText('Preferências salvas');
  await page.reload();
  await expect(page.getByLabel('Folhas em movimento')).not.toBeChecked();
  await page.goto('/dashboard');
  await expect(page.getByRole('combobox', { name: 'Período de análise' })).toHaveValue('30d');
  await expect(page.locator('.leaf-scene')).toHaveClass(/leaf-scene-static/);
});

test('login shows its pending state without storing or sending credentials', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => { if (request.method() === 'POST') requests.push(request.url()); });
  await page.goto('/login');
  await page.getByLabel('E-mail', { exact: true }).fill('test@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Mostrar senha' }).click();
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('O acesso estará disponível');
  await expect(page.getByLabel('Senha', { exact: true })).toHaveValue('');
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('test-password');
});

test('navigation works on desktop and mobile', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Explorar dashboard', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Abrir navegação' }).click();
    await page.getByRole('navigation', { name: 'Navegação móvel' }).getByRole('link', { name: 'Serviços', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Abrir navegação' })).toBeVisible();
  } else {
    await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Serviços', exact: true }).click();
  }
  await expect(page).toHaveURL(/\/servicos$/);
  await page.getByRole('searchbox', { name: 'Buscar serviço ou região' }).fill('inexistente');
  await page.getByRole('combobox', { name: 'Filtrar por estado' }).selectOption('unavailable');
  await expect(page.getByText('Um espaço para seus serviços.')).toBeVisible();
});

test('leaf parallax responds to the pointer and respects reduced motion', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Touch screens use static decorative leaves.');
  await page.goto('/dashboard');
  const layer = page.locator('.leaf-scene');
  await page.mouse.move(1300, 650);
  await expect.poll(async () => layer.evaluate((element) => element.style.getPropertyValue('--pointer-x'))).not.toBe('0px');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.floating-leaf').first()).toHaveCSS('animation-name', 'none');
  await expect.poll(async () => layer.evaluate((element) => Math.abs(parseFloat(element.style.getPropertyValue('--pointer-x'))))).toBeLessThan(0.1);
});

test('home changes landscapes, switches language and keeps its scale on its own route', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('.hero__background')).toHaveCount(5);
  await expect(page.locator('.hero__background.active')).toHaveCSS('background-image', /hero-landscape/);
  await page.getByRole('button', { name: 'Slide anterior', exact: true }).click();
  await expect(page.locator('.hero__background.active')).toHaveCSS('background-image', /hero-lagoon/);
  await page.getByRole('button', { name: 'Próximo slide', exact: true }).click();
  await expect(page.locator('.hero__background.active')).toHaveCSS('background-image', /hero-landscape/);
  await page.getByRole('button', { name: 'Próximo slide', exact: true }).click();
  await expect(page.locator('.hero__background.active')).toHaveCSS('background-image', /hero-lugano/);
  await page.getByRole('combobox', { name: 'Idioma' }).selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Understanding today');
  await page.getByRole('combobox', { name: 'Language' }).selectOption('pt');
  await expect(page.getByText('Exemplo de cálculo', { exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveCSS('font-size', testInfo.project.name === 'desktop' ? '28px' : '16px');
  if (testInfo.project.name === 'desktop') {
    await page.getByRole('button', { name: 'Ir para slide 3', exact: true }).click();
    await expect(page.locator('.hero__background.active')).toHaveCSS('background-image', /hero-lakes/);
  } else {
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    await expect(page.locator('#mobile-navigation')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-navigation')).toHaveCount(0);
  }
  await page.getByRole('link', { name: 'Explorar dashboard', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator('html')).toHaveCSS('font-size', '16px');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
});

test('comparison stays empty and unknown routes provide a way home', async ({ page }) => {
  await page.goto('/comparar');
  await expect(page.getByRole('combobox', { name: 'Adicionar serviço à comparação' })).toBeDisabled();
  await expect(page.getByText('Perspectivas que se complementam.')).toBeVisible();
  await page.goto('/pagina-inexistente');
  await expect(page.getByText('404 · UM PEQUENO DESVIO')).toBeVisible();
  await page.getByRole('link', { name: 'Voltar ao início' }).click();
  await expect(page).toHaveURL(/\/$/);
});
