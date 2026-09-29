const { test, expect } = require('@playwright/test');

// Identical steps and assertions; only the two page paths differ.
const examples = [
  { name: 'flat', home: '/home', about: '/about' },
  { name: 'grouped', home: '/grouped-home', about: '/grouped-about' },
];

const documentOrigin = page => page.evaluate(() => performance.timeOrigin);
const background = page => page.getByTestId('background');
const editLink = page => page.getByRole('link', { name: 'Edit Dialog', exact: true });

async function attachTree(page, testInfo, name) {
  await testInfo.attach(name, {
    body: JSON.stringify(await page.evaluate(() => history.state), null, 2),
    contentType: 'application/json',
  });
}

async function prepare(page, example) {
  await page.goto(example.home);
  await expect(page.getByTestId('time-origin')).toHaveText(/^\d/);
  const origin = await documentOrigin(page);
  await editLink(page).click();
  await page.getByRole('button', { name: 'Mutate', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Result dialog' })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(example.home);
  await expect(background(page)).toHaveAttribute('data-example', example.name);
  expect(await documentOrigin(page)).toBe(origin);
  return origin;
}

async function refresh(page) {
  const response = page.waitForResponse(res =>
    new URL(res.url()).searchParams.has('_rsc') && res.request().method() === 'GET');
  await page.getByRole('button', { name: 'Router Refresh', exact: true }).click();
  await (await response).finished();
  // Observe delayed fallback navigation, not just the first RSC response.
  await page.waitForTimeout(1500);
}

for (const example of examples) {
  test.describe(example.name, () => {
    test('unchanged background survives refresh', async ({ page }) => {
      const origin = await prepare(page, example);
      await editLink(page).click();
      await refresh(page);
      expect(await documentOrigin(page)).toBe(origin);
      await expect(background(page)).toHaveAttribute('data-example', example.name);
      await expect(page.getByRole('heading', { name: 'Home Page', exact: true })).toBeVisible();
    });

    const reproducing = process.env.EXPECT_RELOAD === '1' && example.name === 'grouped';
    test(reproducing ? 'changed background reproduces the unwanted reload' : 'changed background survives refresh', async ({ page }, testInfo) => {
      const origin = await prepare(page, example);
      await page.getByRole('link', { name: 'About Page', exact: true }).click();
      await expect(page).toHaveURL(example.about);
      await expect(page.getByRole('heading', { name: 'About Page', exact: true })).toBeVisible();
      await attachTree(page, testInfo, 'after-navigation-to-about');

      await editLink(page).click();
      await expect(page.getByRole('heading', { name: 'Edit dialog' })).toBeVisible();
      await expect(background(page)).toHaveAttribute('data-example', example.name);
      expect(await documentOrigin(page)).toBe(origin);
      await attachTree(page, testInfo, 'before-refresh');
      await refresh(page);
      await attachTree(page, testInfo, 'after-refresh');

      if (reproducing) {
        await expect.poll(() => documentOrigin(page)).not.toBe(origin);
        await expect(background(page)).toHaveCount(0);
      } else {
        expect(await documentOrigin(page), 'router.refresh() must not replace the document').toBe(origin);
        await expect(background(page)).toHaveAttribute('data-example', example.name);
        await expect(page.getByRole('heading', { name: 'About Page', exact: true })).toBeVisible();
      }
      expect(new URL(page.url()).pathname).toBe('/edit');
      expect(new URL(page.url()).searchParams.get('closePath')).toBe(example.about);
    });

    test('both dialog steps close to the originating About page', async ({ page }) => {
      await page.goto(example.about);
      await expect(page.getByTestId('time-origin')).toHaveText(/^\d/);
      const origin = await documentOrigin(page);
      await editLink(page).click();
      await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
      await expect(page).toHaveURL(example.about);
      await editLink(page).click();
      await page.getByRole('button', { name: 'Mutate', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Result dialog' })).toBeVisible();
      await page.getByRole('button', { name: 'Back to Edit', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Edit dialog' })).toBeVisible();
      await page.getByRole('button', { name: 'Mutate', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Result dialog' })).toBeVisible();
      await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
      await expect(page).toHaveURL(example.about);
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(background(page)).toHaveAttribute('data-example', example.name);
      expect(await documentOrigin(page)).toBe(origin);
    });
  });
}
