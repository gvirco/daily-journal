import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { initializeDatabase } from './db.js'

test('initializes a persistent database with one entry per user and date', (testContext) => {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'daily-journal-db-'))
  const databasePath = join(temporaryDirectory, 'journal.sqlite')

  testContext.after(() => {
    try {
      rmSync(temporaryDirectory, { force: true, maxRetries: 3, recursive: true, retryDelay: 100 })
    } catch {
      // Windows may retain a temporary SQLite handle briefly after the test exits.
    }
  })

  const firstConnection = initializeDatabase(databasePath)
  firstConnection.prepare('INSERT INTO users (email) VALUES (?)').run('person@example.com')
  firstConnection
    .prepare('INSERT INTO journal_entries (user_id, entry_date) VALUES (?, ?)')
    .run(1, '2026-10-08')

  assert.throws(() => {
    firstConnection
      .prepare('INSERT INTO journal_entries (user_id, entry_date) VALUES (?, ?)')
      .run(1, '2026-10-08')
  })
  firstConnection.close()

  const secondConnection = initializeDatabase(databasePath)
  const entry = secondConnection
      .prepare('SELECT entry_date FROM journal_entries WHERE user_id = ?')
      .get(1) as { entry_date: string } | undefined

  assert.equal(entry?.entry_date, '2026-10-08')
  secondConnection.close()
})
