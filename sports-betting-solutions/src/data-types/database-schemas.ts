export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      bankrolls: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          initial_amount: number
          current_amount: number
          currency: string
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          initial_amount: number
          current_amount: number
          currency?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          initial_amount?: number
          current_amount?: number
          currency?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bankrolls_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      bets: {
        Row: {
          id: string
          user_id: string
          bankroll_id: string
          sport: string
          event_name: string
          selection: string
          stake: number
          odds: number
          bet_type: string
          status: string
          result: string | null
          profit_loss: number | null
          created_at: string
          settled_at: string | null
          closing_odds: number | null
          notes: string | null
          competition: string | null
          event_date: string | null
          event_id: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          bankroll_id: string
          sport: string
          event_name: string
          selection: string
          stake: number
          odds: number
          bet_type: string
          status?: string
          result?: string | null
          profit_loss?: number | null
          created_at?: string
          settled_at?: string | null
          closing_odds?: number | null
          notes?: string | null
          competition?: string | null
          event_date?: string | null
          event_id?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          bankroll_id?: string
          sport?: string
          event_name?: string
          selection?: string
          stake?: number
          odds?: number
          bet_type?: string
          status?: string
          result?: string | null
          profit_loss?: number | null
          created_at?: string
          settled_at?: string | null
          closing_odds?: number | null
          notes?: string | null
          competition?: string | null
          event_date?: string | null
          event_id?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "bets_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bets_bankroll_id_fkey"
            columns: ["bankroll_id"]
            referencedRelation: "bankrolls"
            referencedColumns: ["id"]
          }
        ]
      }
      horse_racing_bets: {
        Row: {
          bet_id: string
          track_name: string
          race_number: string | null
          horse_name: string
          jockey: string | null
          trainer: string | null
          race_distance: string | null
          race_type: string | null
          track_condition: string | null
          barrier_position: string | null
          weight_carried: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          bet_id: string
          track_name: string
          race_number?: string | null
          horse_name: string
          jockey?: string | null
          trainer?: string | null
          race_distance?: string | null
          race_type?: string | null
          track_condition?: string | null
          barrier_position?: string | null
          weight_carried?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          bet_id?: string
          track_name?: string
          race_number?: string | null
          horse_name?: string
          jockey?: string | null
          trainer?: string | null
          race_distance?: string | null
          race_type?: string | null
          track_condition?: string | null
          barrier_position?: string | null
          weight_carried?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "horse_racing_bets_bet_id_fkey"
            columns: ["bet_id"]
            referencedRelation: "bets"
            referencedColumns: ["id"]
          }
        ]
      }
      football_bets: {
        Row: {
          bet_id: string
          home_team: string
          away_team: string
          league: string | null
          match_time: string | null
          bet_market: string | null
          handicap: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          bet_id: string
          home_team: string
          away_team: string
          league?: string | null
          match_time?: string | null
          bet_market?: string | null
          handicap?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          bet_id?: string
          home_team?: string
          away_team?: string
          league?: string | null
          match_time?: string | null
          bet_market?: string | null
          handicap?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "football_bets_bet_id_fkey"
            columns: ["bet_id"]
            referencedRelation: "bets"
            referencedColumns: ["id"]
          }
        ]
      }
      basketball_bets: {
        Row: {
          bet_id: string
          home_team: string
          away_team: string
          league: string | null
          match_time: string | null
          bet_market: string | null
          handicap: number | null
          quarter: string | null
          player_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          bet_id: string
          home_team: string
          away_team: string
          league?: string | null
          match_time?: string | null
          bet_market?: string | null
          handicap?: number | null
          quarter?: string | null
          player_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          bet_id?: string
          home_team?: string
          away_team?: string
          league?: string | null
          match_time?: string | null
          bet_market?: string | null
          handicap?: number | null
          quarter?: string | null
          player_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "basketball_bets_bet_id_fkey"
            columns: ["bet_id"]
            referencedRelation: "bets"
            referencedColumns: ["id"]
          }
        ]
      }
      user_settings: {
        Row: {
          user_id: string
          default_stake: number | null
          default_bankroll_id: string | null
          stake_currency: string
          preferred_odds_format: string
          ai_preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          default_stake?: number | null
          default_bankroll_id?: string | null
          stake_currency?: string
          preferred_odds_format?: string
          ai_preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          default_stake?: number | null
          default_bankroll_id?: string | null
          stake_currency?: string
          preferred_odds_format?: string
          ai_preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_settings_default_bankroll_id_fkey"
            columns: ["default_bankroll_id"]
            referencedRelation: "bankrolls"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_interactions: {
        Row: {
          id: string
          user_id: string
          model_used: string
          interaction_type: string
          tokens_used: number | null
          cost: number | null
          created_at: string
          success: boolean
          context: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          model_used: string
          interaction_type: string
          tokens_used?: number | null
          cost?: number | null
          created_at?: string
          success?: boolean
          context?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          model_used?: string
          interaction_type?: string
          tokens_used?: number | null
          cost?: number | null
          created_at?: string
          success?: boolean
          context?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_interactions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          email: string
          telegram_username: string | null
          phone_number: string | null
          country: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          email: string
          telegram_username?: string | null
          phone_number?: string | null
          country?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          email?: string
          telegram_username?: string | null
          phone_number?: string | null
          country?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 