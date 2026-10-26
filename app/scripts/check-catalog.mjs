import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'

// Focused FE-006/007 checks, not the FE-038/039 business-rule test suite.
// Uses the same TS/JSON pipeline as the app, without installing a test framework.
const server = await createServer({ server: { middlewareMode: true, watch: null }, appType: 'custom' })
let checks = 0
try {
  const { normalizeCatalog } = await server.ssrLoadModule('/src/data/catalog/normalize.ts')
  const { getCatalogData } = await server.ssrLoadModule('/src/data/catalog/index.ts')
  const collections = ['directions', 'organizers', 'venues', 'instructors', 'groups', 'schedules']
  const raw = Object.fromEntries(await Promise.all(collections.map(async name => [name, JSON.parse(await readFile(new URL(`../src/data/catalog/demo/${name}.json`, import.meta.url), 'utf8'))])))
  function check(name, run) { run(); checks++; console.log(`PASS ${name}`) }
  const baseline = normalizeCatalog(raw)
  check('valid demo and public loader', () => {
    assert.equal(baseline.diagnostics.length, 0)
    assert.equal(baseline.data.groups.length, 13)
    assert.equal(baseline.data.schedules.length, 15)
    assert.deepEqual(getCatalogData().stats, baseline.stats)
    for (const key of collections) assert.equal(baseline.stats[key].excluded, 0)
  })
  check('formats, tariffs, lifecycle and enrollment coverage', () => {
    for (const [field, expected] of [['activityFormat', ['offline', 'online', 'hybrid']], ['priceType', ['free', 'perLesson', 'monthly']], ['activityStatus', ['planned', 'active', 'paused', 'completed']], ['enrollmentStatus', ['openNow', 'openFromDate', 'waitlist', 'closed']]]) {
      assert.deepEqual([...new Set(baseline.data.groups.map(g => g[field]))].sort(), expected.sort())
    }
    assert(baseline.data.groups.some(g => g.activityFormat === 'online' && !('venueId' in g)))
    assert(baseline.data.groups.some(g => g.activityFormat === 'online' && g.venueId === null))
    assert(baseline.data.groups.some(g => g.participationConditions))
    assert(baseline.data.groups.some(g => g.lessonsPerWeek === 2))
    assert(baseline.data.groups.some(g => g.priceAmount > 2000)) // monthly budget-overrun fixture
    assert(baseline.data.venues.some(v => v.elevator === null))
    assert(baseline.data.venues.some(v => v.elevator === false))
    assert(baseline.data.venues.some(v => v.elevator === true))
    assert(baseline.data.directions.some(d => d.parentId))
    assert(new Set(baseline.data.venues.map(v => v.area)).size >= 3)
    assert(new Set(baseline.data.schedules.map(s => s.weekday)).size === 7)
    for (const group of baseline.data.groups) assert.equal(group.lessonsPerWeek, baseline.data.schedules.filter(s => s.groupId === group.id).length)
  })
  check('explicit conflict, 29/30-minute and time-period fixtures', () => {
    const sessions = baseline.data.schedules
    const minutes = time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3))
    const walk = sessions.find(s => s.groupId === 'group-walk' && s.weekday === 1)
    const art = sessions.find(s => s.groupId === 'group-art')
    assert(art.startTime < walk.endTime && walk.startTime < art.endTime)
    for (const gap of [29, 30]) {
      const session = sessions.find(s => s.groupId === `group-gap${gap}`)
      assert.equal(session.weekday, walk.weekday)
      assert.equal(minutes(session.startTime) - minutes(walk.endTime), gap)
      const group = baseline.data.groups.find(g => g.id === session.groupId)
      assert.equal(group.activityFormat, 'offline')
      assert.notEqual(group.venueId, baseline.data.groups.find(g => g.id === walk.groupId).venueId)
    }
    assert(sessions.some(s => s.startTime === '11:30' && s.endTime === '12:30'))
    assert(sessions.some(s => s.startTime >= '08:00' && s.startTime <= '11:59'))
    assert(sessions.some(s => s.startTime >= '12:00' && s.startTime <= '16:59'))
    assert(sessions.some(s => s.startTime >= '17:00' && s.startTime <= '21:00'))
  })
  check('no defaults for optional fields, no input mutation or shared references', () => {
    const before = structuredClone(raw)
    const result = normalizeCatalog(raw)
    assert.equal(result.data.venues[0].elevator, null)
    assert.equal('description' in result.data.directions[1], false)
    assert.equal('website' in result.data.organizers[1], false)
    result.data.groups[0].directionIds.push('mutation')
    assert.deepEqual(raw, before)
    assert(!getCatalogData().data.groups[0].directionIds.includes('mutation'))
  })
  check('untrusted monthly cost stripped without calculating a placeholder', () => {
    const input = structuredClone(raw)
    input.groups[0].estimatedMonthlyCost = -999
    const result = normalizeCatalog(input)
    assert.equal(result.data.groups.length, 13)
    assert.equal('estimatedMonthlyCost' in result.data.groups[0], false)
    assert(result.diagnostics.some(d => d.code === 'derived-cost-ignored'))
  })
  function badGroup(name, mutate) {
    check(name, () => {
      const input = structuredClone(raw)
      mutate(input.groups[0])
      const result = normalizeCatalog(input)
      assert(!result.data.groups.some(g => g.id === 'group-walk'))
      assert.equal(result.data.groups.length, 12)
      assert(!result.data.schedules.some(s => s.groupId === 'group-walk'))
      assert(result.diagnostics.some(d => d.severity === 'error'))
    })
  }
  for (const [name, mutate] of [
    ['missing required field', g => { delete g.title }],
    ['invalid enum', g => { g.activityFormat = 'teleport' }],
    ['separate lifecycle/enrollment enums', g => { g.activityStatus = 'openNow' }],
    ['negative price', g => { g.priceAmount = -1 }],
    ['nonfinite price', g => { g.priceAmount = Infinity }],
    ['wrong numeric type', g => { g.lessonsPerWeek = '2' }],
    ['fractional lesson count', g => { g.lessonsPerWeek = 1.5 }],
    ['capacity bounds', g => { g.availablePlaces = g.capacity + 1 }],
    ['negative capacity', g => { g.capacity = -1 }],
    ['wrong nullable accessibility-independent field', g => { g.availablePlaces = false }],
    ['offline missing venue', g => { delete g.venueId }],
    ['hybrid missing venue', g => { g.activityFormat = 'hybrid'; g.venueId = null }],
    ['dangling venue', g => { g.venueId = 'missing' }],
    ['dangling organizer', g => { g.organizerId = 'missing' }],
    ['dangling instructor', g => { g.instructorIds = ['missing'] }],
    ['dangling direction', g => { g.directionIds = ['missing'] }],
    ['invalid calendar date', g => { g.nextEntryDate = '2026-02-31' }],
    ['lessonsPerWeek mismatch', g => { g.lessonsPerWeek = 3 }],
    ['malformed onlineDetails', g => { g.activityFormat = 'hybrid'; g.onlineDetails = { platform: 123 } }],
  ]) badGroup(name, mutate)
  for (const [field, value] of [['weekday', 0], ['weekday', 8], ['weekday', 1.5], ['startTime', '9:00'], ['startTime', '24:00'], ['startTime', '10:60'], ['startTime', '11:00'], ['startTime', '12:00']]) {
    check(`invalid Schedule ${field}=${value}`, () => {
      const input = structuredClone(raw)
      input.schedules[0][field] = value
      const result = normalizeCatalog(input)
      assert(!result.data.schedules.some(s => s.id === 'session-01'))
      assert(!result.data.groups.some(g => g.id === 'group-walk'))
      assert.equal(result.stats.groups.excluded, 1)
      assert.equal(result.stats.schedules.excluded, 2)
    })
  }
  check('duplicate IDs in every collection', () => {
    for (const collection of collections) {
      const input = structuredClone(raw)
      input[collection].push(structuredClone(input[collection][0]))
      const result = normalizeCatalog(input)
      assert(result.diagnostics.some(d => d.code === 'duplicate-id' && d.collection === collection))
      assert(!result.data[collection].some(row => row.id === input[collection][0].id))
      assert(result.stats[collection].excluded >= 2)
    }
  })
  check('orphan Schedule and invalid individual record isolation', () => {
    const input = structuredClone(raw)
    input.schedules.push({ id: 'orphan', groupId: 'missing', weekday: 1, startTime: '10:00', endTime: '11:00' })
    input.groups.push(null, 123, { id: 'incomplete' })
    const result = normalizeCatalog(input)
    assert.equal(result.stats.groups.excluded, 3)
    assert.equal(result.stats.schedules.excluded, 1)
    assert.equal(result.data.groups.length, 13)
  })
  check('direction hierarchy cycles and missing parents cascade safely', () => {
    for (const parentId of ['walking', 'missing']) {
      const input = structuredClone(raw)
      input.directions[0].parentId = parentId
      const result = normalizeCatalog(input)
      assert(!result.data.directions.some(d => d.id === 'movement' || d.id === 'walking'))
      assert(!result.data.groups.some(g => g.directionIds.includes('walking') || g.directionIds.includes('movement')))
      assert(result.data.groups.some(g => g.id === 'group-art'))
    }
  })
  check('unknown optional values preserved; invalid known values rejected', () => {
    const input = structuredClone(raw)
    input.venues[0].elevator = 'unknown'
    const result = normalizeCatalog(input)
    assert(!result.data.venues.some(v => v.id === 'venue-a'))
    assert(!result.data.groups.some(g => g.venueId === 'venue-a'))
  })
  check('optional onlineDetails, empty details and offline applicability', () => {
    const input = structuredClone(raw)
    input.groups[0].onlineDetails = { platform: 'inapplicable' }
    input.groups.find(g => g.id === 'group-online').onlineDetails = {}
    const result = normalizeCatalog(input)
    assert.equal(result.data.groups.length, 13)
    assert(!('onlineDetails' in result.data.groups[0]))
    assert.deepEqual(result.data.groups.find(g => g.id === 'group-online').onlineDetails, {})
    assert(result.diagnostics.some(d => d.code === 'not-applicable'))
  })
  check('top-level corruption and collection corruption do not throw', () => {
    for (const input of [null, [], 7, {}, { ...raw, groups: null }, { ...raw, schedules: 'bad' }]) {
      const result = normalizeCatalog(input)
      assert.equal(result.data.groups.length, 0)
      assert(result.diagnostics.some(d => d.severity === 'error'))
    }
  })
  check('source order is stable after excluding one invalid record', () => {
    const input = structuredClone(raw)
    input.groups.splice(2, 0, { id: 'bad' })
    assert.deepEqual(normalizeCatalog(input).data.groups.map(g => g.id), baseline.data.groups.map(g => g.id))
  })
  const mixed = structuredClone(raw)
  mixed.groups.push({ id: 'broken-group' })
  mixed.schedules.push({ id: 'broken-session', groupId: 'group-art', weekday: 8, startTime: '25:00', endTime: '10:00' })
  mixed.venues.push({ id: 'broken-venue' })
  const mixedResult = normalizeCatalog(mixed)
  check('mixed fixture has exact record counts', () => {
    assert.equal(mixedResult.stats.groups.excluded, 1)
    assert.equal(mixedResult.stats.schedules.excluded, 1)
    assert.equal(mixedResult.stats.venues.excluded, 1)
    assert.equal(mixedResult.data.groups.length, 13)
  })
  check('project contact and full demo onlineDetails', () => {
    for (const organizer of baseline.data.organizers) {
      assert.equal(organizer.contactLink, 'mailto:ekanitki@gmail.com')
      assert.match(organizer.description, /учебн/iu)
      assert.equal(organizer.verificationStatus, 'Учебные данные, не проверено')
    }
    for (const group of baseline.data.groups.filter(g => g.activityFormat !== 'offline')) {
      assert.equal(group.onlineDetails.supportContact, 'ekanitki@gmail.com')
    }
    for (const group of baseline.data.groups.filter(g => g.activityStatus === 'active' && g.enrollmentStatus === 'openNow')) {
      const organizer = baseline.data.organizers.find(o => o.id === group.organizerId)
      assert.equal(organizer.contactLink, 'mailto:ekanitki@gmail.com')
    }
    for (const id of ['group-online', 'group-hybrid']) {
      const details = baseline.data.groups.find(g => g.id === id).onlineDetails
      for (const field of ['platform', 'deviceRequirements', 'connectionInstructions', 'supportContact']) assert(details[field])
      assert.equal(details.supportContact, 'ekanitki@gmail.com')
    }
  })
  console.log(JSON.stringify({ checks, validDemo: baseline.stats, mixedFixture: mixedResult.stats }, null, 2))
} finally {
  await server.close()
}
