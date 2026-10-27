import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { ActivityPlan } from '../../../src/types/domain'

// Literal expectations from the educational JSON, not calculated by production code.
export const titles = {
  walk: 'Учебная группа: регулярная ходьба',
  art: 'Учебная группа: акварель',
  gap29: 'Учебная группа: рисунок после прогулки (29 минут)',
  gap30: 'Учебная группа: движение после прогулки (30 минут)',
  online: 'Учебная онлайн-группа: цифровые навыки',
  hybrid: 'Учебная гибридная группа: творческая мастерская',
  budget: 'Учебная группа: занятия дважды в неделю',
} as const
export const catalogTitles = [titles.walk, titles.art, titles.gap29, titles.gap30, titles.online, titles.hybrid, titles.budget]
export const planKey = 'dolgoletie.activityPlan.v1'
export const planFields = ['activityIds', 'monthlyBudget', 'estimatedMonthlyTotal', 'createdAt', 'updatedAt'].sort()

export async function readPlan(page: Page): Promise<ActivityPlan | null> {
  return page.evaluate(key => {
    try { return JSON.parse(localStorage.getItem(key) ?? 'null') }
    catch { return null }
  }, planKey)
}

export async function openCatalog(page: Page) {
  await page.goto('/')
  await page.getByRole('link', { name: 'Смотреть занятия', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Каталог занятий')
}

export async function expectCatalog(page: Page, expected: string[]) {
  await expect(page.getByRole('article').getByRole('heading', { level: 2 })).toHaveText(expected)
  await expect(page.getByRole('status')).toHaveText(`Найдено групп: ${expected.length}`)
}

export async function addFromCatalog(page: Page, title: string) {
  const card = page.getByRole('article').filter({ has: page.getByRole('heading', { level: 2, name: title, exact: true }) })
  await card.getByRole('link', { name: /Подробнее/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
  await page.getByRole('button', { name: 'Добавить в мой план', exact: true }).click()
  await expect(page).toHaveURL('/activity-added')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Занятие добавлено в план')
  await expect(page.getByRole('main').getByText(title, { exact: true })).toBeVisible()
}

export async function expectPlan(page: Page, selectedTitles: string[], total: RegExp) {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Мой план')
  const count = page.getByText(`Выбрано групп: ${selectedTitles.length}`, { exact: true })
  await expect(count).toBeVisible()
  await expect(page.getByRole('region', { name: 'Выбранные занятия', exact: true }).getByRole('heading', { level: 3 })).toHaveText(selectedTitles)
  // The overview is the parent of the count, outside per-group price cards.
  // Scoping by this anchor prevents a card price from masking an incorrect total.
  await expect(count.locator('..').getByText(total)).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('План сохранён в этом браузере.')
}
