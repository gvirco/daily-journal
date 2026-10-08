import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
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
  firstConnection.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('journal-user', 'hash')
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

test('migrates the original email schema without deleting users or journal entries', (testContext) => {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'daily-journal-migration-'))
  const databasePath = join(temporaryDirectory, 'journal.sqlite')
  testContext.after(() => {
    try {
      rmSync(temporaryDirectory, { force: true, maxRetries: 3, recursive: true, retryDelay: 100 })
    } catch {
      // Windows may retain a temporary SQLite handle briefly after the test exits.
    }
  })

  const legacyDatabase = new DatabaseSync(databasePath)
  legacyDatabase.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE journal_entries (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      entry_date TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, entry_date)
    );
  `)
  legacyDatabase.prepare('INSERT INTO users (email) VALUES (?)').run('legacy@example.com')
  legacyDatabase.prepare('INSERT INTO journal_entries (user_id, entry_date) VALUES (?, ?)').run(1, '2026-10-08')
  legacyDatabase.close()

  const migratedDatabase = initializeDatabase(databasePath)
  const user = migratedDatabase.prepare('SELECT id, username, legacy_email FROM users').get() as {
    id: number
    legacy_email: string
    username: string
  }
  const entryCount = migratedDatabase.prepare('SELECT COUNT(*) AS count FROM journal_entries').get() as { count: number }

  assert.equal(user.id, 1)
  assert.equal(user.username, 'legacy-user-1')
  assert.equal(user.legacy_email, 'legacy@example.com')
  assert.equal(entryCount.count, 1)
  migratedDatabase.close()
})
