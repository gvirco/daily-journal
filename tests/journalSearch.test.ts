import { describe, expect, it } from 'vitest'
import { getJournalSearchExcerpt, matchesJournalEntry } from '../src/domain/journalSearch'

const entry = {
  date: '2026-10-13',
  title: 'A Productive Tuesday',
  notes: 'Built the prototype in Vilnius.',
  goals: [{ text: 'Finish HARNESS review', completed: true }],
  evening: {
    whatWorked: 'Running first thing',
    whatDidNotWork: 'Too many meetings',
    whatDidILearn: 'Smaller tasks are easier',
  },
}

describe('historical journal search', () => {
  it.each([
    ['productive', true],
    ['PRODUCTIVE', true],
    ['vIlNiUs', true],
    ['harness', true],
    ['meetings', true],
    ['smaller tasks', true],
    ['running', true],
    ['unrelated', false],
    ['  ', false],
  ])('matches %s: %s', (query, expected) => {
    expect(matchesJournalEntry(entry, query)).toBe(expected)
  })

  it('works with historical entries without titles or optional sections', () => {
    expect(matchesJournalEntry({ date: '2026-01-01', notes: 'Legacy content' }, 'LEGACY')).toBe(true)
    expect(matchesJournalEntry({ date: '2026-01-02' }, 'anything')).toBe(false)
  })

  it('shows the matching field rather than unrelated notes', () => {
    expect(getJournalSearchExcerpt(entry, 'meetings')).toBe('Too many meetings')
  })
})
