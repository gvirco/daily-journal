export type Rating10 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export interface MorningJournal {
  energy?: Rating10
  mood?: Rating10
  focus?: Rating10
}

export interface DailyGoal {
  text: string
  completed: boolean
}

export interface EveningReview {
  dayRating?: Rating10
  whatWorked?: string
  whatDidNotWork?: string
  whatDidILearn?: string
}

export interface DailyJournalEntry {
  date: string
  morning?: MorningJournal
  goals?: DailyGoal[]
  notes?: string
  evening?: EveningReview
}
