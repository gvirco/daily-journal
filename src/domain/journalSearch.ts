import type { DailyJournalEntry } from './DailyJournalEntry'

function entryTexts(entry: DailyJournalEntry): string[] {
  const values = [
    entry.title,
    entry.notes,
    ...(entry.goals ?? []).map((goal) => goal.text),
    entry.evening?.whatWorked,
    entry.evening?.whatDidNotWork,
    entry.evening?.whatDidILearn,
  ]
  return values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
}

export function matchesJournalEntry(entry: DailyJournalEntry, query: string): boolean {
  const needle = query.trim().toLowerCase()
  return needle.length > 0 && entryTexts(entry).some((text) => text.toLowerCase().includes(needle))
}

export function getJournalSearchExcerpt(entry: DailyJournalEntry, query: string): string {
  const texts = entryTexts(entry)
  const needle = query.trim().toLowerCase()
  return (texts.find((text) => text.toLowerCase().includes(needle)) ?? texts[0] ?? 'No text preview').trim()
}
