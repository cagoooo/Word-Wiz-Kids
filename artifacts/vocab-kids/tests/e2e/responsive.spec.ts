import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('word-wiz-student', JSON.stringify({ id: 'e2e-student', nickname: '測試英雄', avatar: 1 }));
    localStorage.setItem('vocab-kids-sound-muted', 'true');
  });
});

test('home page and navigation fit every supported viewport', async ({ page }) => {
  await page.goto('/#/');
  await expect(page.getByText('神奇單字', { exact: true })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('game setup remains reachable without horizontal overflow', async ({ page }) => {
  await page.goto('/#/game');
  await expect(page.locator('body')).toBeVisible();
  const metrics = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    height: document.documentElement.scrollHeight,
  }));
  expect(metrics.overflow).toBeLessThanOrEqual(1);
  expect(metrics.height).toBeGreaterThan(0);
});
