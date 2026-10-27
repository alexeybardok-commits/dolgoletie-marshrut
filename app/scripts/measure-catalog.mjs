import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { preview } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const index = readFileSync(new URL('../dist/index.html', import.meta.url))
const server = await preview({ root, preview: { host: '127.0.0.1', port: 4191, strictPort: true } })
let browser
try {
  browser = await chromium.launch({ channel: 'msedge', headless: true })
  const names = {
    walk: 'Учебная группа: регулярная ходьба', art: 'Учебная группа: акварель',
    gap29: 'Учебная группа: рисунок после прогулки (29 минут)',
    gap30: 'Учебная группа: движение после прогулки (30 минут)',
    online: 'Учебная онлайн-группа: цифровые навыки',
    hybrid: 'Учебная гибридная группа: творческая мастерская',
    budget: 'Учебная группа: занятия дважды в неделю',
  }
  const all = Object.values(names)
  const report = {
    date: new Date().toISOString(), node: process.version, browser: browser.version(),
    preview: 'http://127.0.0.1:4191', indexSha256: createHash('sha256').update(index).digest('hex'),
    conditions: 'Headless Edge; no CPU/network throttling; local production preview; warmed catalog; 10 measured repetitions per width.',
    methodology: 'Browser capture-event timestamp to expected card headings + result count, then two requestAnimationFrame callbacks. Excludes automation dispatch, scrolling, initial loading and physical display latency. 10-second watchdog is not a UX threshold.',
    widths: [],
  }
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    try {
      const page = await context.newPage()
      const pageErrors = []
      page.on('pageerror', error => pageErrors.push(error.message))
      await page.goto(report.preview + '/activities')
      await page.getByRole('article').last().waitFor()
      await page.evaluate(() => {
        globalThis.__catalogLongTasks = []
        globalThis.__catalogLongTasksSupported = globalThis.PerformanceObserver.supportedEntryTypes.includes('longtask')
        if (globalThis.__catalogLongTasksSupported) {
          const observer = new globalThis.PerformanceObserver(list => {
            for (const entry of list.getEntries()) globalThis.__catalogLongTasks.push({ startTime: entry.startTime, duration: entry.duration })
          })
          observer.observe({ type: 'longtask' })
        }
      })
      const samples = []
      async function measure(label, eventType, expected, action, record) {
        await page.evaluate(({ eventType, expected }) => {
          const doc = globalThis.document
          const state = { start: null, result: null }
          globalThis.__catalogProbe = state
          let completed = false
          const observer = new globalThis.MutationObserver(check)
          const watchdog = globalThis.setTimeout(() => {
            doc.removeEventListener(eventType, onEvent, true)
            observer.disconnect()
            state.result = { error: 'Expected catalog state not observed within 10 seconds' }
          }, 10_000)
          function check() {
            if (state.start === null || completed) return
            const headings = [...doc.querySelectorAll('main article h2')].map(h => h.textContent)
            const status = doc.querySelector('main [role="status"]')?.textContent
            if (JSON.stringify(headings) !== JSON.stringify(expected) || status !== `Найдено групп: ${expected.length}`) return
            completed = true
            observer.disconnect()
            const domMs = globalThis.performance.now() - state.start
            globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(() => {
              globalThis.clearTimeout(watchdog)
              state.result = { domMs, twoFramesMs: globalThis.performance.now() - state.start }
            }))
          }
          function onEvent() {
            state.start = globalThis.performance.now()
            doc.removeEventListener(eventType, onEvent, true)
            globalThis.queueMicrotask(check)
          }
          observer.observe(doc.querySelector('main'), { childList: true, subtree: true, characterData: true })
          doc.addEventListener(eventType, onEvent, true)
        }, { eventType, expected })
        await action()
        await page.waitForFunction(() => globalThis.__catalogProbe.result !== null)
        const result = await page.evaluate(() => globalThis.__catalogProbe.result)
        if (result.error) throw new Error(`${label}: ${result.error}`)
        if (record) samples.push({ label, ...result })
      }
      for (let repeat = 0; repeat <= 10; repeat++) {
        const record = repeat > 0 // First complete sequence is an unmeasured warm-up.
        // React handles checkbox changes from click; capture before that handler,
        // rather than native change, which can arrive after React has committed.
        await measure('direction', 'click', [names.art, names.gap29, names.hybrid], () => page.getByRole('checkbox', { name: 'Творчество', exact: true }).check(), record)
        await measure('direction+area', 'click', [names.art, names.gap29], () => page.getByRole('checkbox', { name: 'Кировский', exact: true }).check(), record)
        await measure('direction+area+budget', 'change', [names.art], () => page.getByLabel('Бюджет в месяц', { exact: true }).selectOption('0'), record)
        await measure('search+filters:empty', 'input', [], () => page.getByLabel('Поиск по каталогу', { exact: true }).fill('нетсовпаденийлокаудит'), record)
        await measure('search+filters:match', 'input', [names.art], () => page.getByLabel('Поиск по каталогу', { exact: true }).fill('акварель'), record)
        await measure('reset-filters', 'click', all, () => page.getByRole('button', { name: 'Сбросить всё', exact: true }).click(), record)
        await measure('text-search', 'input', [names.online], () => page.getByLabel('Поиск по каталогу', { exact: true }).fill('цифровые'), record)
        await measure('clear-search', 'click', all, () => page.getByRole('button', { name: 'Очистить поиск', exact: true }).click(), record)
        if (!record) await page.evaluate(() => { globalThis.__catalogLongTasks = [] })
      }
      const summarize = values => {
        const sorted = [...values].sort((a, b) => a - b)
        const rounded = value => Math.round(value * 100) / 100
        return { median: rounded(sorted[Math.ceil(sorted.length / 2) - 1]), p95: rounded(sorted[Math.ceil(sorted.length * 0.95) - 1]), max: rounded(sorted.at(-1)) }
      }
      const operations = [...new Set(samples.map(s => s.label))].map(label => {
        const selected = samples.filter(s => s.label === label)
        return { label, samples: selected.length, domMs: summarize(selected.map(s => s.domMs)), twoFramesMs: summarize(selected.map(s => s.twoFramesMs)) }
      })
      const longTasks = await page.evaluate(() => ({ supported: globalThis.__catalogLongTasksSupported, entries: globalThis.__catalogLongTasks }))
      report.widths.push({ width, samples: samples.length, operations, longTasks, pageErrors })
      if (pageErrors.length) throw new Error(pageErrors.join('\n'))
    } finally { await context.close() }
  }
  console.log(JSON.stringify(report, null, 2))
} finally {
  try { await browser?.close() }
  finally { await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve())) }
}
