import { test, expect } from '../playwright-fixture';

test('snippet', async ({ page, context, browser, request }) => {
  await page.goto('/');

  // CAT-06: Bulk select and actions
  test.setTimeout(50000);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /try demo/i }).first().click();
  await page.waitForTimeout(3000);

  const overlay = page.locator('.fixed.inset-0.bg-black\\/50');
  if (await overlay.isVisible({ timeout: 2000 }).catch(() => false)) {
    await overlay.click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);
  }

  await page.getByRole('link', { name: 'Catalog' }).click({ timeout: 5000 });
  await page.waitForTimeout(2000);

  // Check header checkbox to select all
  const headerCheckbox = page.locator('table thead').getByRole('checkbox');
  console.log('Header checkbox visible:', await headerCheckbox.isVisible());
  await headerCheckbox.click();
  await page.waitForTimeout(500);

  // Check if bulk action bar appears
  const bulkBar = page.getByText(/selected/i);
  const hasBulkBar = await bulkBar.isVisible().catch(() => false);
  console.log('Bulk action bar visible:', hasBulkBar);

  console.log('CAT-06:', hasBulkBar ? 'PASS' : 'FAIL');

});
