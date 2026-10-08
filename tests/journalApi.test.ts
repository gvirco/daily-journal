import assert from 'node:assert/strict'
import test from 'node:test'
import { getJournalEntry, saveJournalEntry } from '../src/services/journalApi.js'

test('uses cookie credentials and maps a missing journal entry to null', async (testContext) => {
  const originalFetch = globalThis.fetch
  const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = []
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ init, input })
    return new Response(null, { status: 404 })
  }) as typeof fetch

  testContext.after(() => { globalThis.fetch = originalFetch })

  assert.equal(await getJournalEntry('2026-10-08'), null)
  assert.equal(calls[0]?.input, '/api/entries/2026-10-08')
  assert.equal(calls[0]?.init?.credentials, 'include')
})

test('sends complete replacement entries through the API', async (testContext) => {
  const originalFetch = globalThis.fetch
  let request: { input: RequestInfo | URL; init?: RequestInit } | undefined
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    request = { init, input }
    return new Response(null, { status: 200 })
  }) as typeof fetch

  testContext.after(() => { globalThis.fetch = originalFetch })

  await saveJournalEntry({ date: '2026-10-08', notes: 'Saved remotely' })
  assert.equal(request?.input, '/api/entries/2026-10-08')
  assert.equal(request?.init?.method, 'PUT')
  assert.equal(request?.init?.credentials, 'include')
  assert.equal(request?.init?.body, JSON.stringify({ date: '2026-10-08', notes: 'Saved remotely' }))
})
