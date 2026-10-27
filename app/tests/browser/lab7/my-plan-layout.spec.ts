import { expect, test } from '@playwright/test'
import { addFromCatalog, openCatalog, titles } from './support'

test.use({ storageState: { cookies: [], origins: [] } })

for (const width of [375, 768, 1280]) {
  test(`REG-PLAN-01 selected-card actions do not overlap at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await openCatalog(page)
    await addFromCatalog(page, titles.walk)
    await page.getByRole('link', { name: 'Продолжить поиск', exact: true }).click()
    await addFromCatalog(page, titles.gap29)
    await page.getByRole('link', { name: 'Перейти в мой план', exact: true }).click()
    const selected = page.getByRole('region', { name: 'Выбранные занятия', exact: true })
    const cards = selected.getByRole('listitem')
    await expect(cards).toHaveCount(2)
    for (const card of await cards.all()) {
      const details = card.getByRole('link', { name: /Подробнее/ })
      const remove = card.getByRole('button', { name: /^Удалить из плана:/ })
      await details.scrollIntoViewIfNeeded()
      await expect(details).toBeVisible()
      await expect(remove).toBeVisible()
      const linkBox = await details.boundingBox()
      const buttonBox = await remove.boundingBox()
      const cardBox = await card.boundingBox()
      if (!linkBox || !buttonBox || !cardBox) throw new Error('Card actions must have visible geometry')
      const horizontalGap = Math.max(buttonBox.x - linkBox.x - linkBox.width, linkBox.x - buttonBox.x - buttonBox.width)
      const verticalGap = Math.max(buttonBox.y - linkBox.y - linkBox.height, linkBox.y - buttonBox.y - buttonBox.height)
      // Require distinct hit areas with a real gutter on either axis, including wrapping.
      expect(Math.max(horizontalGap, verticalGap), `Action gap at ${width}px`).toBeGreaterThanOrEqual(11.5)
      for (const box of [linkBox, buttonBox]) {
        expect(box.x).toBeGreaterThanOrEqual(cardBox.x - 0.5)
        expect(box.x + box.width).toBeLessThanOrEqual(cardBox.x + cardBox.width + 0.5)
        expect(box.y).toBeGreaterThanOrEqual(cardBox.y - 0.5)
        expect(box.y + box.height).toBeLessThanOrEqual(cardBox.y + cardBox.height + 0.5)
      }
      // Playwright's hit testing must also confirm neither control is covered.
      await details.click({ trial: true })
      await remove.click({ trial: true })
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

    await selected.getByRole('button', { name: `Удалить из плана: ${titles.walk}`, exact: true }).click()
    await expect(selected.getByRole('heading', { level: 3 })).toHaveText([titles.gap29])
    await page.getByRole('button', { name: 'Отменить удаление', exact: true }).click()
    await expect(selected.getByRole('heading', { level: 3 })).toHaveText([titles.walk, titles.gap29])
    await selected.getByRole('listitem').filter({ has: page.getByRole('heading', { name: titles.walk, exact: true, level: 3 }) }).getByRole('link', { name: /Подробнее/ }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(titles.walk)
    await expect(page.getByRole('button', { name: 'Уже в плане', exact: true })).toBeDisabled()
  })
}
