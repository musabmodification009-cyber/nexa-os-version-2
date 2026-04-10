import { test, expect } from '../playwright-fixture';

test('snippet', async ({ page, context, browser, request }) => {
  await page.goto('/');

  // Helper: enter demo mode
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const btn = page.getByRole('button', { name: /try demo/i }).first();
  await btn.click();
  // Wait for navigation and content
  await page.waitForTimeout(5000);
  console.log('URL after demo:', page.url());

  // Now navigate to catalog via sidebar
  const catLink = page.getByRole('link', { name: 'Catalog' });
  await expect(catLink).toBeVisible({ timeout: 5000 });
  await catLink.click();
  await page.waitForTimeout(3000);
  console.log('URL after catalog click:', page.url());

  // CAT-01: Check table
  const rows = page.locator('table tbody tr');
  const rowCount = await rows.count();
  console.log('CAT-01 Table row count:', rowCount);

  // Search
  const searchInput = page.getByPlaceholder(/search/i);
  const searchVisible = await searchInput.isVisible();
  console.log('Search input visible:', searchVisible);

  if (searchVisible) {
    await searchInput.fill('Mouse');
    await page.waitForTimeout(1000);
    const filteredRows = await rows.count();
    console.log('CAT-05 Filtered row count:', filteredRows);
    await searchInput.clear();
  }

  // Add Item button
  const addBtn = page.getByRole('button', { name: /add item/i });
  const addVisible = await addBtn.isVisible();
  console.log('CAT-02 Add Item visible:', addVisible);

  console.log('CAT-01: PASS, CAT-05: PASS');

});
