export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          email: string;
          telegram_username?: string;
          phone_number?: string;
          country?: string;
          created_at: string;
          updated_at: string;
          membership_tier?: string;
          membership_end_date?: string;
          stripe_customer_id?: string;
          stripe_subscription_id?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          email: string;
          telegram_username?: string;
          phone_number?: string;
          country?: string;
          created_at?: string;
          updated_at?: string;
          membership_tier?: string;
          membership_end_date?: string;
          stripe_customer_id?: string;
          stripe_subscription_id?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          email?: string;
          telegram_username?: string;
          phone_number?: string;
          country?: string;
          created_at?: string;
          updated_at?: string;
          membership_tier?: string;
          membership_end_date?: string;
          stripe_customer_id?: string;
          stripe_subscription_id?: string;
        };
      };
      bets: {
        Row: {
          id: string;
          user_id: string;
          sport: string;
          event_name: string;
          selection: string;
          stake: number;
          odds: string;
          status: string;
          created_at: string;
          updated_at: string;
          profit_loss?: number;
          returns?: number;
          notes?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sport: string;
          event_name: string;
          selection: string;
          stake: number;
          odds: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
          profit_loss?: number;
          returns?: number;
          notes?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sport?: string;
          event_name?: string;
          selection?: string;
          stake?: number;
          odds?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
          profit_loss?: number;
          returns?: number;
          notes?: string;
        };
      };
    };
  };
}
