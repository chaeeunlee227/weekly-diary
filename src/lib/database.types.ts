// TypeScript types for database
// This file can be auto-generated from Supabase, but here's a manual version

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      weekly_entries: {
        Row: {
          id: string;
          user_id: string;
          week_start: string;
          habits: Json;
          moods: number[];
          meals: Json;
          events: Json;
          grateful: string;
          comment: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start: string;
          habits?: Json;
          moods?: number[];
          meals?: Json;
          events?: Json;
          grateful?: string;
          comment?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_start?: string;
          habits?: Json;
          moods?: number[];
          meals?: Json;
          events?: Json;
          grateful?: string;
          comment?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
