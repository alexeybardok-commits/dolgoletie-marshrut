import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { addFromCatalog, readPlan, titles } from './support'

test.use({ storageState: { cookies: [], origins: [] } })

async function expectCatalogAction(page: Page, empty: boolean) {
  const main = page.getByRole('main')
  const action = main.getByRole('link', { name: empty ? 'Найти занятия' : 'Добавить ещё', exact: true })
  await expect(action).toHaveCount(1)
  await expect(action).toBeVisible()
  await expect(action).toHaveAttribute('href', '/activities')
  await expect(main.getByRole('link', { name: empty ? 'Добавить ещё' : 'Найти занятия', exact: true })).toHaveCount(0)
  if (empty) {
    await expect(main.getByRole('heading', { name: 'В плане пока нет занятий', exact: true })).toBeVisible()
    await expect(main.getByRole('link')).toHaveCount(1)
  }
  await action.click({ trial: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  return action
}

for (const width of [375, 768, 1280]) {
  test(`REG-PLAN-02 only one catalog CTA through empty, filled, delete, Undo and reload at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/my-plan')
    const find = await expectCatalogAction(page, true)
    await find.click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Каталог занятий')
    await addFromCatalog(page, titles.walk)
    await page.getByRole('link', { name: 'Перейти в мой план', exact: true }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Мой план')
    const addMore = await expectCatalogAction(page, false)
    await expect.poll(() => readPlan(page)).toMatchObject({ activityIds: ['group-walk'], estimatedMonthlyTotal: 4000 })
    const before = await readPlan(page)
    await addMore.click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Каталог занятий')
    await page.getByRole('banner').getByRole('link', { name: 'Мой план', exact: true }).click()
    await expectCatalogAction(page, false)
    await expect.poll(() => readPlan(page)).toEqual(before)

    const remove = page.getByRole('button', { name: `Удалить из плана: ${titles.walk}`, exact: true })
    await remove.click()
    await expectCatalogAction(page, true)
    await expect.poll(() => readPlan(page)).toMatchObject({ activityIds: [], estimatedMonthlyTotal: 0 })
    await page.getByRole('button', { name: 'Отменить удаление', exact: true }).click()
    await expectCatalogAction(page, false)
    await expect.poll(() => readPlan(page)).toMatchObject({ activityIds: ['group-walk'], estimatedMonthlyTotal: 4000 })
    await expect(page.getByRole('region', { name: 'Выбранные занятия', exact: true }).getByRole('heading', { level: 3 })).toHaveText([titles.walk])

    await remove.click()
    await expectCatalogAction(page, true)
    await expect.poll(() => readPlan(page)).toMatchObject({ activityIds: [], estimatedMonthlyTotal: 0 })
    await page.reload()
    await expectCatalogAction(page, true)
    await expect(page.getByRole('button', { name: 'Отменить удаление', exact: true })).toHaveCount(0)
    await expect.poll(() => readPlan(page)).toMatchObject({ activityIds: [], estimatedMonthlyTotal: 0 })
  })
}
