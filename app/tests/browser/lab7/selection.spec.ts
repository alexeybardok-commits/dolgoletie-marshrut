import { expect, test } from '@playwright/test'
import { addFromCatalog, expectPlan, openCatalog, readPlan, titles } from './support'

test.use({ storageState: { cookies: [], origins: [] } })

test('R2-01 Detail adds one group; revisiting cannot duplicate or toggle it', async ({ page }) => {
  await openCatalog(page)
  await addFromCatalog(page, titles.walk)
  await page.getByRole('link', { name: 'Перейти в мой план', exact: true }).click()
  await expectPlan(page, [titles.walk], /^Ориентировочно за месяц: 4\s000\s₽$/)
  await expect.poll(() => readPlan(page)).toMatchObject({ activityIds: ['group-walk'], estimatedMonthlyTotal: 4000 })
  const before = await readPlan(page)
  await page.getByRole('region', { name: 'Выбранные занятия', exact: true }).getByRole('link', { name: /Подробнее/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(titles.walk)
  await expect(page.getByRole('button', { name: 'Уже в плане', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Добавить в мой план', exact: true })).toHaveCount(0)
  await page.getByRole('banner').getByRole('link', { name: 'Мой план', exact: true }).click()
  await expectPlan(page, [titles.walk], /^Ориентировочно за месяц: 4\s000\s₽$/)
  await expect.poll(() => readPlan(page)).toEqual(before)
})

test('R2-02 five unique groups can be added despite informational warnings', async ({ page }) => {
  await openCatalog(page)
  for (const title of [titles.walk, titles.art, titles.gap29, titles.gap30, titles.online]) {
    await addFromCatalog(page, title)
    await page.getByRole('link', { name: 'Продолжить поиск', exact: true }).click()
  }
  await page.getByRole('banner').getByRole('link', { name: 'Мой план', exact: true }).click()
  await expectPlan(page, [titles.walk, titles.art, titles.gap29, titles.gap30, titles.online], /^Ориентировочно за месяц: 9\s500\s₽$/)
  await expect.poll(() => readPlan(page)).toMatchObject({
    activityIds: ['group-walk', 'group-art', 'group-gap29', 'group-gap30', 'group-online'],
    estimatedMonthlyTotal: 9500,
  })
  const warnings = page.getByRole('region', { name: 'На что обратить внимание', exact: true })
  await expect(warnings.getByText('Пересечение по времени.', { exact: true }).first()).toBeVisible()
  await expect(warnings.getByText('Мало времени на дорогу.', { exact: true }).first()).toBeVisible()
})
