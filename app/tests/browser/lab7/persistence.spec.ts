import { expect, test } from '@playwright/test'
import { addFromCatalog, expectPlan, openCatalog, planFields, planKey, readPlan, titles } from './support'

test.use({ storageState: { cookies: [], origins: [] } })

test('R3-01 selected groups, weekly sessions, total and budget survive reload', async ({ page }) => {
  await openCatalog(page)
  await page.getByLabel('Бюджет в месяц', { exact: true }).selectOption('5000')
  for (const title of [titles.walk, titles.art, titles.online]) {
    await addFromCatalog(page, title)
    await page.getByRole('link', { name: 'Продолжить поиск', exact: true }).click()
  }
  await page.getByLabel('Поиск по каталогу', { exact: true }).fill('акварель')
  await page.getByRole('checkbox', { name: 'Творчество', exact: true }).check()
  await page.getByRole('banner').getByRole('link', { name: 'Мой план', exact: true }).click()
  await expectPlan(page, [titles.walk, titles.art, titles.online], /^Ориентировочно за месяц: 4\s000\s₽$/)
  await expect.poll(() => readPlan(page)).toMatchObject({
    activityIds: ['group-walk', 'group-art', 'group-online'], monthlyBudget: 5000, estimatedMonthlyTotal: 4000,
  })
  const saved = await readPlan(page)
  expect(Object.keys(saved ?? {}).sort()).toEqual(planFields)
  await page.reload()
  await expectPlan(page, [titles.walk, titles.art, titles.online], /^Ориентировочно за месяц: 4\s000\s₽$/)
  await expect(page.getByText('Бюджет в месяц: До 5 000 ₽', { exact: true })).toBeVisible()
  const week = page.getByRole('region', { name: 'Расписание на неделю', exact: true })
  await expect(week.getByRole('heading', { level: 4 })).toHaveCount(4)
  await expect(week.getByRole('heading', { name: titles.walk, exact: true })).toHaveCount(2)
  await expect(week.getByText('10:00–11:00', { exact: true })).toBeVisible()
  await expect(week.getByText('11:30–12:30', { exact: true })).toBeVisible()
  await expect.poll(() => readPlan(page)).toEqual(saved)
  await page.getByRole('link', { name: 'Добавить ещё', exact: true }).click()
  await expect(page.getByLabel('Бюджет в месяц', { exact: true })).toHaveValue('5000')
  await expect(page.getByLabel('Поиск по каталогу', { exact: true })).toHaveValue('')
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Сбросить всё', exact: true }).click()
  await expect.poll(() => readPlan(page)).toMatchObject({
    activityIds: ['group-walk', 'group-art', 'group-online'], monthlyBudget: null, estimatedMonthlyTotal: 4000,
  })
})

for (const [label, serialized] of [
  ['unparseable JSON', '{broken'],
  ['invalid object structure', '{"activityIds":"bad","monthlyBudget":5000}'],
] as const) {
  test(`R3-02 ${label} recovers safely and permits subsequent saving`, async ({ page }) => {
    await page.goto('/')
    await expect.poll(() => readPlan(page)).toMatchObject({ activityIds: [], monthlyBudget: null, estimatedMonthlyTotal: 0 })
    // Seed storage once; an init script would incorrectly reseed every reload.
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: planKey, value: serialized })
    await page.goto('/my-plan')
    await expect(page.getByRole('heading', { name: 'В плане пока нет занятий', exact: true })).toBeVisible()
    await expect(page.getByText('Выбрано групп: 0', { exact: true })).toBeVisible()
    await expect.poll(() => readPlan(page)).toMatchObject({ activityIds: [], monthlyBudget: null, estimatedMonthlyTotal: 0 })
    await page.getByRole('link', { name: 'Найти занятия', exact: true }).click()
    await addFromCatalog(page, titles.walk)
    await page.getByRole('link', { name: 'Перейти в мой план', exact: true }).click()
    await expectPlan(page, [titles.walk], /^Ориентировочно за месяц: 4\s000\s₽$/)
    await expect.poll(() => readPlan(page)).toMatchObject({ activityIds: ['group-walk'], estimatedMonthlyTotal: 4000 })
    await page.reload()
    await expectPlan(page, [titles.walk], /^Ориентировочно за месяц: 4\s000\s₽$/)
  })
}

test('R3-03 recovery keeps valid IDs once, drops unknown IDs and distrusts stale totals', async ({ page }) => {
  await page.goto('/')
  await expect.poll(() => readPlan(page)).toMatchObject({ activityIds: [], monthlyBudget: null, estimatedMonthlyTotal: 0 })
  await page.evaluate(key => {
    localStorage.setItem(key, JSON.stringify({
      activityIds: ['group-walk', 'missing-group', 'group-art', 'group-walk', 1, 'group-online'],
      monthlyBudget: '5000', estimatedMonthlyTotal: 999999,
      createdAt: '2026-10-20T09:00:00.000Z', updatedAt: '2026-10-25T09:00:00.000Z',
      filters: { query: 'не восстанавливать' }, lastRemoval: { activityId: 'group-art', index: 1 },
    }))
    localStorage.setItem('myPlan', '[1,2,3]')
  }, planKey)
  await page.goto('/my-plan')
  await expectPlan(page, [titles.walk, titles.art, titles.online], /^Ориентировочно за месяц: 4\s000\s₽$/)
  await expect(page.getByRole('button', { name: 'Отменить удаление', exact: true })).toHaveCount(0)
  await expect.poll(() => readPlan(page)).toEqual({
    activityIds: ['group-walk', 'group-art', 'group-online'], monthlyBudget: null, estimatedMonthlyTotal: 4000,
    createdAt: '2026-10-20T09:00:00.000Z', updatedAt: '2026-10-25T09:00:00.000Z',
  })
  await page.reload()
  await expectPlan(page, [titles.walk, titles.art, titles.online], /^Ориентировочно за месяц: 4\s000\s₽$/)
  expect(await page.evaluate(() => localStorage.getItem('myPlan'))).toBe('[1,2,3]')
  expect(Object.keys(await readPlan(page) ?? {}).sort()).toEqual(planFields)
  await page.getByRole('link', { name: 'Добавить ещё', exact: true }).click()
  await expect(page.getByLabel('Бюджет в месяц', { exact: true })).toHaveValue('')
  await expect(page.getByLabel('Поиск по каталогу', { exact: true })).toHaveValue('')
})
