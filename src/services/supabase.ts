import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      journal_entries: {
        Row: {
          content: Json
          entry_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: Json
          entry_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          entry_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          due_date: string
          priority: 'Low' | 'Medium' | 'High'
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          title: string
          due_date: string
          priority?: 'Low' | 'Medium' | 'High'
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          due_date?: string
          priority?: 'Low' | 'Medium' | 'High'
          completed?: boolean
        }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

let client: SupabaseClient<Database> | null = null

export function getSupabaseClient() {
  if (supabaseUrl === undefined || supabasePublishableKey === undefined) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.')
  }

  client ??= createClient<Database>(supabaseUrl, supabasePublishableKey)
  return client
}
