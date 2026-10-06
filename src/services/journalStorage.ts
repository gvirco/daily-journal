import type { DailyJournalEntry } from '../domain/DailyJournalEntry'

const entryKeyPrefix = 'daily-journal:entry:'

function getEntryKey(date: string) {
  return `${entryKeyPrefix}${date}`
}

export function getJournalEntry(date: string): DailyJournalEntry | null {
  const storedEntry = localStorage.getItem(getEntryKey(date))

  if (storedEntry === null) {
    return null
  }

  return JSON.parse(storedEntry) as DailyJournalEntry
}

export function saveJournalEntry(entry: DailyJournalEntry): void {
  localStorage.setItem(getEntryKey(entry.date), JSON.stringify(entry))
}
