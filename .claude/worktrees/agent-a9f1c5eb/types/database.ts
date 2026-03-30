export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          color: string
          partner_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          color?: string
          partner_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          partner_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      diary_entries: {
        Row: {
          id: string
          user_id: string
          diary_date: string
          content: string
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          diary_date: string
          content: string
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          diary_date?: string
          content?: string
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stamps: {
        Row: {
          id: string
          diary_entry_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          diary_entry_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          diary_entry_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
      }
      invite_codes: {
        Row: {
          id: string
          code: string
          created_by: string
          used_by: string | null
          used_at: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          created_by: string
          used_by?: string | null
          used_at?: string | null
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          created_by?: string
          used_by?: string | null
          used_at?: string | null
          expires_at?: string
          created_at?: string
        }
      }
    }
    Views: {
      my_and_partner_diaries: {
        Row: {
          id: string
          user_id: string
          user_name: string
          user_color: string
          diary_date: string
          content: string
          published_at: string | null
          created_at: string
          author_type: 'me' | 'partner'
        }
      }
    }
  }
}
