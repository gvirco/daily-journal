import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

export const defaultDatabasePath = 'data/daily-journal.sqlite'

type TableColumn = { name: string }

function tableExists(database: DatabaseSync, tableName: string): boolean {
  return database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName) !== undefined
}

function hasColumn(database: DatabaseSync, tableName: string, columnName: string): boolean {
  const columns = database.prepare(`PRAGMA table_info(${tableName})`).all() as TableColumn[]
  return columns.some((column) => column.name === columnName)
}

function createCurrentTables(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL COLLATE NOCASE UNIQUE,
      password_hash TEXT,
      legacy_email TEXT UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      entry_date TEXT NOT NULL CHECK (entry_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
      content TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (user_id, entry_date)
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS sessions_token_hash_index ON sessions(token_hash);
  `)
}

function migrateEmailUsers(database: DatabaseSync): void {
  if (!hasColumn(database, 'users', 'email')) {
    throw new Error('Unsupported users table schema; refusing to migrate data.')
  }

  database.exec('PRAGMA foreign_keys = OFF')
  try {
    database.exec(`
      BEGIN;
      ALTER TABLE journal_entries RENAME TO journal_entries_legacy;
      ALTER TABLE users RENAME TO users_legacy;
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        username TEXT NOT NULL COLLATE NOCASE UNIQUE,
        password_hash TEXT,
        legacy_email TEXT UNIQUE,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO users (id, username, password_hash, legacy_email, created_at)
      SELECT id, 'legacy-user-' || id, NULL, email, created_at FROM users_legacy;
      CREATE TABLE journal_entries (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        entry_date TEXT NOT NULL CHECK (entry_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
        content TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (user_id, entry_date)
      );
      INSERT INTO journal_entries (id, user_id, entry_date, content, created_at, updated_at)
      SELECT id, user_id, entry_date, content, created_at, updated_at FROM journal_entries_legacy;
      DROP TABLE journal_entries_legacy;
      DROP TABLE users_legacy;
      COMMIT;
    `)
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  } finally {
    database.exec('PRAGMA foreign_keys = ON')
  }
}

export function initializeDatabase(databasePath = defaultDatabasePath): DatabaseSync {
  mkdirSync(dirname(databasePath), { recursive: true })
  const database = new DatabaseSync(databasePath)
  database.exec('PRAGMA foreign_keys = ON')

  if (tableExists(database, 'users') && !hasColumn(database, 'users', 'username')) {
    migrateEmailUsers(database)
  }

  createCurrentTables(database)
  return database
}
