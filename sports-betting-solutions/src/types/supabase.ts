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
      races: {
        Row: {
          race_id: string
          course: string
          course_id: string
          race_date: string
          off_time: string | null
          off_dt: string | null
          race_name: string | null
          distance: string | null
          distance_f: number | null
          distance_round: string | null
          pattern: string | null
          race_class: string | null
          type: string | null
          age_band: string | null
          rating_band: string | null
          sex_restriction: string | null
          going: string | null
          going_detailed: string | null
          surface: string | null
          weather: string | null
          jumps: string | null
          prize: string | null
          field_size: number | null
          rail_movements: string | null
          stalls: string | null
          region: string | null
          big_race: boolean | null
          is_abandoned: boolean | null
          tip: string | null
          verdict: string | null
          betting_forecast: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          race_id: string
          course: string
          course_id: string
          race_date: string
          off_time?: string | null
          off_dt?: string | null
          race_name?: string | null
          distance?: string | null
          distance_f?: number | null
          distance_round?: string | null
          pattern?: string | null
          race_class?: string | null
          type?: string | null
          age_band?: string | null
          rating_band?: string | null
          sex_restriction?: string | null
          going?: string | null
          going_detailed?: string | null
          surface?: string | null
          weather?: string | null
          jumps?: string | null
          prize?: string | null
          field_size?: number | null
          rail_movements?: string | null
          stalls?: string | null
          region?: string | null
          big_race?: boolean | null
          is_abandoned?: boolean | null
          tip?: string | null
          verdict?: string | null
          betting_forecast?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          race_id?: string
          course?: string
          course_id?: string
          race_date?: string
          off_time?: string | null
          off_dt?: string | null
          race_name?: string | null
          distance?: string | null
          distance_f?: number | null
          distance_round?: string | null
          pattern?: string | null
          race_class?: string | null
          type?: string | null
          age_band?: string | null
          rating_band?: string | null
          sex_restriction?: string | null
          going?: string | null
          going_detailed?: string | null
          surface?: string | null
          weather?: string | null
          jumps?: string | null
          prize?: string | null
          field_size?: number | null
          rail_movements?: string | null
          stalls?: string | null
          region?: string | null
          big_race?: boolean | null
          is_abandoned?: boolean | null
          tip?: string | null
          verdict?: string | null
          betting_forecast?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      runners: {
        Row: {
          id: number
          race_id: string | null
          horse_id: string
          horse_name: string
          number: string | null
          draw: string | null
          dob: string | null
          age: number | null
          sex: string | null
          sex_code: string | null
          colour: string | null
          region: string | null
          breeder: string | null
          sire: string | null
          sire_id: string | null
          sire_region: string | null
          dam: string | null
          dam_id: string | null
          dam_region: string | null
          damsire: string | null
          damsire_id: string | null
          damsire_region: string | null
          trainer: string | null
          trainer_id: string | null
          trainer_location: string | null
          trainer_rtf: string | null
          trainer_14_days_runs: number | null
          trainer_14_days_wins: number | null
          trainer_14_days_percent: string | null
          jockey: string | null
          jockey_id: string | null
          owner: string | null
          owner_id: string | null
          weight_lbs: string | null
          headgear: string | null
          headgear_run: string | null
          wind_surgery: string | null
          wind_surgery_run: string | null
          form: string | null
          last_run: string | null
          ofr: string | null
          rpr: string | null
          ts: string | null
          comment: string | null
          spotlight: string | null
          silk_url: string | null
          past_results_flags: Json | null
          prev_trainers: Json | null
          prev_owners: Json | null
          quotes: Json | null
          stable_tour: Json | null
          medical: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          race_id?: string | null
          horse_id: string
          horse_name: string
          number?: string | null
          draw?: string | null
          dob?: string | null
          age?: number | null
          sex?: string | null
          sex_code?: string | null
          colour?: string | null
          region?: string | null
          breeder?: string | null
          sire?: string | null
          sire_id?: string | null
          sire_region?: string | null
          dam?: string | null
          dam_id?: string | null
          dam_region?: string | null
          damsire?: string | null
          damsire_id?: string | null
          damsire_region?: string | null
          trainer?: string | null
          trainer_id?: string | null
          trainer_location?: string | null
          trainer_rtf?: string | null
          trainer_14_days_runs?: number | null
          trainer_14_days_wins?: number | null
          trainer_14_days_percent?: string | null
          jockey?: string | null
          jockey_id?: string | null
          owner?: string | null
          owner_id?: string | null
          weight_lbs?: string | null
          headgear?: string | null
          headgear_run?: string | null
          wind_surgery?: string | null
          wind_surgery_run?: string | null
          form?: string | null
          last_run?: string | null
          ofr?: string | null
          rpr?: string | null
          ts?: string | null
          comment?: string | null
          spotlight?: string | null
          silk_url?: string | null
          past_results_flags?: Json | null
          prev_trainers?: Json | null
          prev_owners?: Json | null
          quotes?: Json | null
          stable_tour?: Json | null
          medical?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          race_id?: string | null
          horse_id?: string
          horse_name?: string
          number?: string | null
          draw?: string | null
          dob?: string | null
          age?: number | null
          sex?: string | null
          sex_code?: string | null
          colour?: string | null
          region?: string | null
          breeder?: string | null
          sire?: string | null
          sire_id?: string | null
          sire_region?: string | null
          dam?: string | null
          dam_id?: string | null
          dam_region?: string | null
          damsire?: string | null
          damsire_id?: string | null
          damsire_region?: string | null
          trainer?: string | null
          trainer_id?: string | null
          trainer_location?: string | null
          trainer_rtf?: string | null
          trainer_14_days_runs?: number | null
          trainer_14_days_wins?: number | null
          trainer_14_days_percent?: string | null
          jockey?: string | null
          jockey_id?: string | null
          owner?: string | null
          owner_id?: string | null
          weight_lbs?: string | null
          headgear?: string | null
          headgear_run?: string | null
          wind_surgery?: string | null
          wind_surgery_run?: string | null
          form?: string | null
          last_run?: string | null
          ofr?: string | null
          rpr?: string | null
          ts?: string | null
          comment?: string | null
          spotlight?: string | null
          silk_url?: string | null
          past_results_flags?: Json | null
          prev_trainers?: Json | null
          prev_owners?: Json | null
          quotes?: Json | null
          stable_tour?: Json | null
          medical?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "runners_race_id_fkey"
            columns: ["race_id"]
            referencedRelation: "races"
            referencedColumns: ["race_id"]
          }
        ]
      }
      odds: {
        Row: {
          id: number
          runner_id: number
          race_id: string
          horse_id: string | null
          horse_name: string | null
          race_date: string | null
          bet365: number | null
          william_hill: number | null
          paddy_power: number | null
          sky_bet: number | null
          ladbrokes: number | null
          coral: number | null
          betfair: number | null
          betfred: number | null
          unibet: number | null
          bet_uk: number | null
          bet365_opening: string | null
          william_hill_opening: string | null
          paddy_power_opening: string | null
          coral_opening: string | null
          sky_bet_opening: string | null
          betfred_opening: string | null
          boyle_sports_opening: string | null
          ladbrokes_opening: string | null
          unibet_opening: string | null
          bet_goodwin_opening: string | null
          bet_victor_opening: string | null
          ten_bet_opening: string | null
          betmgm_opening: string | null
          grosvenor_sports_opening: string | null
          betway_opening: string | null
          virgin_bet_opening: string | null
          talksport_bet_opening: string | null
          dragon_bet_opening: string | null
          copybet_opening: string | null
          pricedup_bet_opening: string | null
          hollywood_bets_opening: string | null
          star_sports_opening: string | null
          seven_bet_opening: string | null
          gentlemen_jim_opening: string | null
          bet442_opening: string | null
          sporting_index_opening: string | null
          ak_bets_opening: string | null
          midnite_opening: string | null
          spreadex_opening: string | null
          quinn_bet_opening: string | null
          betfair_exchange_opening: string | null
          matchbook_opening: string | null
          bet365_history: Json | null
          william_hill_history: Json | null
          paddy_power_history: Json | null
          sky_bet_history: Json | null
          ladbrokes_history: Json | null
          coral_history: Json | null
          betfair_history: Json | null
          betfred_history: Json | null
          unibet_history: Json | null
          bet_uk_history: Json | null
          bet_goodwin_history: Json | null
          bet_victor_history: Json | null
          ten_bet_history: Json | null
          betmgm_history: Json | null
          grosvenor_sports_history: Json | null
          betway_history: Json | null
          virgin_bet_history: Json | null
          talksport_bet_history: Json | null
          dragon_bet_history: Json | null
          copybet_history: Json | null
          pricedup_bet_history: Json | null
          hollywood_bets_history: Json | null
          star_sports_history: Json | null
          gentlemen_jim_history: Json | null
          sporting_index_history: Json | null
          ak_bets_history: Json | null
          midnite_history: Json | null
          spreadex_history: Json | null
          quinn_bet_history: Json | null
          betfair_exchange_history: Json | null
          matchbook_history: Json | null
          boyle_sports_history: Json | null
          seven_bet_history: Json | null
          bet442_history: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          runner_id: number
          race_id: string
          horse_id?: string | null
          horse_name?: string | null
          race_date?: string | null
          bet365?: number | null
          william_hill?: number | null
          paddy_power?: number | null
          sky_bet?: number | null
          ladbrokes?: number | null
          coral?: number | null
          betfair?: number | null
          betfred?: number | null
          unibet?: number | null
          bet_uk?: number | null
          bet365_opening?: string | null
          william_hill_opening?: string | null
          paddy_power_opening?: string | null
          coral_opening?: string | null
          sky_bet_opening?: string | null
          betfred_opening?: string | null
          boyle_sports_opening?: string | null
          ladbrokes_opening?: string | null
          unibet_opening?: string | null
          bet_goodwin_opening?: string | null
          bet_victor_opening?: string | null
          ten_bet_opening?: string | null
          betmgm_opening?: string | null
          grosvenor_sports_opening?: string | null
          betway_opening?: string | null
          virgin_bet_opening?: string | null
          talksport_bet_opening?: string | null
          dragon_bet_opening?: string | null
          copybet_opening?: string | null
          pricedup_bet_opening?: string | null
          hollywood_bets_opening?: string | null
          star_sports_opening?: string | null
          seven_bet_opening?: string | null
          gentlemen_jim_opening?: string | null
          bet442_opening?: string | null
          sporting_index_opening?: string | null
          ak_bets_opening?: string | null
          midnite_opening?: string | null
          spreadex_opening?: string | null
          quinn_bet_opening?: string | null
          betfair_exchange_opening?: string | null
          matchbook_opening?: string | null
          bet365_history?: Json | null
          william_hill_history?: Json | null
          paddy_power_history?: Json | null
          sky_bet_history?: Json | null
          ladbrokes_history?: Json | null
          coral_history?: Json | null
          betfair_history?: Json | null
          betfred_history?: Json | null
          unibet_history?: Json | null
          bet_uk_history?: Json | null
          bet_goodwin_history?: Json | null
          bet_victor_history?: Json | null
          ten_bet_history?: Json | null
          betmgm_history?: Json | null
          grosvenor_sports_history?: Json | null
          betway_history?: Json | null
          virgin_bet_history?: Json | null
          talksport_bet_history?: Json | null
          dragon_bet_history?: Json | null
          copybet_history?: Json | null
          pricedup_bet_history?: Json | null
          hollywood_bets_history?: Json | null
          star_sports_history?: Json | null
          gentlemen_jim_history?: Json | null
          sporting_index_history?: Json | null
          ak_bets_history?: Json | null
          midnite_history?: Json | null
          spreadex_history?: Json | null
          quinn_bet_history?: Json | null
          betfair_exchange_history?: Json | null
          matchbook_history?: Json | null
          boyle_sports_history?: Json | null
          seven_bet_history?: Json | null
          bet442_history?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          runner_id?: number
          race_id?: string
          horse_id?: string | null
          horse_name?: string | null
          race_date?: string | null
          bet365?: number | null
          william_hill?: number | null
          paddy_power?: number | null
          sky_bet?: number | null
          ladbrokes?: number | null
          coral?: number | null
          betfair?: number | null
          betfred?: number | null
          unibet?: number | null
          bet_uk?: number | null
          bet365_opening?: string | null
          william_hill_opening?: string | null
          paddy_power_opening?: string | null
          coral_opening?: string | null
          sky_bet_opening?: string | null
          betfred_opening?: string | null
          boyle_sports_opening?: string | null
          ladbrokes_opening?: string | null
          unibet_opening?: string | null
          bet_goodwin_opening?: string | null
          bet_victor_opening?: string | null
          ten_bet_opening?: string | null
          betmgm_opening?: string | null
          grosvenor_sports_opening?: string | null
          betway_opening?: string | null
          virgin_bet_opening?: string | null
          talksport_bet_opening?: string | null
          dragon_bet_opening?: string | null
          copybet_opening?: string | null
          pricedup_bet_opening?: string | null
          hollywood_bets_opening?: string | null
          star_sports_opening?: string | null
          seven_bet_opening?: string | null
          gentlemen_jim_opening?: string | null
          bet442_opening?: string | null
          sporting_index_opening?: string | null
          ak_bets_opening?: string | null
          midnite_opening?: string | null
          spreadex_opening?: string | null
          quinn_bet_opening?: string | null
          betfair_exchange_opening?: string | null
          matchbook_opening?: string | null
          bet365_history?: Json | null
          william_hill_history?: Json | null
          paddy_power_history?: Json | null
          sky_bet_history?: Json | null
          ladbrokes_history?: Json | null
          coral_history?: Json | null
          betfair_history?: Json | null
          betfred_history?: Json | null
          unibet_history?: Json | null
          bet_uk_history?: Json | null
          bet_goodwin_history?: Json | null
          bet_victor_history?: Json | null
          ten_bet_history?: Json | null
          betmgm_history?: Json | null
          grosvenor_sports_history?: Json | null
          betway_history?: Json | null
          virgin_bet_history?: Json | null
          talksport_bet_history?: Json | null
          dragon_bet_history?: Json | null
          copybet_history?: Json | null
          pricedup_bet_history?: Json | null
          hollywood_bets_history?: Json | null
          star_sports_history?: Json | null
          gentlemen_jim_history?: Json | null
          sporting_index_history?: Json | null
          ak_bets_history?: Json | null
          midnite_history?: Json | null
          spreadex_history?: Json | null
          quinn_bet_history?: Json | null
          betfair_exchange_history?: Json | null
          matchbook_history?: Json | null
          boyle_sports_history?: Json | null
          seven_bet_history?: Json | null
          bet442_history?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "odds_runner_id_fkey"
            columns: ["runner_id"]
            referencedRelation: "runners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odds_race_id_fkey"
            columns: ["race_id"]
            referencedRelation: "races"
            referencedColumns: ["race_id"]
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
      racing_bets: {
        Row: {
          id: string
          user_id: string
          track_name: string
          race_number: string | null
          horse_name: string
          jockey: string | null
          trainer: string | null
          race_distance: string | null
          race_type: string | null
          created_at: string
          scheduled_race_time: string | null
          bet_type: string
          stake: number
          odds: number
          each_way: boolean | null
          status: string
          bookmaker: string | null
          model: string | null
          notes: string | null
          updated_at: string
          returns: number | null
          profit_loss: number | null
          race_date: string | null
        }
        Insert: {
          id?: string
          user_id: string
          track_name: string
          race_number?: string | null
          horse_name: string
          jockey?: string | null
          trainer?: string | null
          race_distance?: string | null
          race_type?: string | null
          created_at?: string
          scheduled_race_time?: string | null
          bet_type: string
          stake: number
          odds: number
          each_way?: boolean | null
          status?: string
          bookmaker?: string | null
          model?: string | null
          notes?: string | null
          updated_at?: string
          returns?: number | null
          profit_loss?: number | null
          race_date?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          track_name?: string
          race_number?: string | null
          horse_name?: string
          jockey?: string | null
          trainer?: string | null
          race_distance?: string | null
          race_type?: string | null
          created_at?: string
          scheduled_race_time?: string | null
          bet_type?: string
          stake?: number
          odds?: number
          each_way?: boolean | null
          status?: string
          bookmaker?: string | null
          model?: string | null
          notes?: string | null
          updated_at?: string
          returns?: number | null
          profit_loss?: number | null
          race_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "racing_bets_user_id_fkey"
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