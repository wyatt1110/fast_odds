-- Create tables for the sports betting application

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create a custom type for bet status
CREATE TYPE public.bet_status AS ENUM (
  'pending',
  'won',
  'lost',
  'void',
  'cash_out',
  'half_won',
  'half_lost',
  'push'
);

-- Create a custom type for odds format
CREATE TYPE public.odds_format AS ENUM (
  'decimal',
  'fractional',
  'american',
  'hong_kong',
  'indonesian',
  'malay'
);

-- Create bankrolls table
CREATE TABLE public.bankrolls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  initial_amount DECIMAL(15, 2) NOT NULL,
  current_amount DECIMAL(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create bets table
CREATE TABLE public.bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bankroll_id UUID NOT NULL REFERENCES public.bankrolls(id) ON DELETE CASCADE,
  sport TEXT NOT NULL,
  event_name TEXT NOT NULL,
  selection TEXT NOT NULL,
  stake DECIMAL(15, 2) NOT NULL,
  odds DECIMAL(15, 2) NOT NULL,
  bet_type TEXT NOT NULL,
  status bet_status NOT NULL DEFAULT 'pending',
  result TEXT,
  profit_loss DECIMAL(15, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at TIMESTAMPTZ,
  closing_odds DECIMAL(15, 2),
  notes TEXT,
  competition TEXT,
  event_date TIMESTAMPTZ,
  event_id TEXT,
  metadata JSONB
);

-- Create horse racing bets table
CREATE TABLE public.horse_racing_bets (
  bet_id UUID PRIMARY KEY REFERENCES public.bets(id) ON DELETE CASCADE,
  track_name TEXT NOT NULL,
  race_number TEXT,
  horse_name TEXT NOT NULL,
  jockey TEXT,
  trainer TEXT,
  race_distance TEXT,
  race_type TEXT,
  track_condition TEXT,
  barrier_position TEXT,
  weight_carried DECIMAL(5, 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create football bets table
CREATE TABLE public.football_bets (
  bet_id UUID PRIMARY KEY REFERENCES public.bets(id) ON DELETE CASCADE,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  league TEXT,
  match_time TIMESTAMPTZ,
  bet_market TEXT,
  handicap DECIMAL(5, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create basketball bets table
CREATE TABLE public.basketball_bets (
  bet_id UUID PRIMARY KEY REFERENCES public.bets(id) ON DELETE CASCADE,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  league TEXT,
  match_time TIMESTAMPTZ,
  bet_market TEXT,
  handicap DECIMAL(5, 2),
  quarter TEXT,
  player_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user settings table
CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_stake DECIMAL(15, 2),
  default_bankroll_id UUID REFERENCES public.bankrolls(id) ON DELETE SET NULL,
  stake_currency TEXT NOT NULL DEFAULT 'USD',
  preferred_odds_format odds_format NOT NULL DEFAULT 'decimal',
  ai_preferences JSONB NOT NULL DEFAULT '{"simple_tasks": "deepseek", "complex_tasks": "claude"}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create AI interactions table for tracking usage
CREATE TABLE public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_used TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  tokens_used INTEGER,
  cost DECIMAL(10, 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT TRUE,
  context JSONB
);

-- Set up Row Level Security (RLS) policies

-- Bankrolls policies
ALTER TABLE public.bankrolls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bankrolls" 
  ON public.bankrolls FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bankrolls" 
  ON public.bankrolls FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bankrolls" 
  ON public.bankrolls FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bankrolls" 
  ON public.bankrolls FOR DELETE 
  USING (auth.uid() = user_id);

-- Bets policies
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bets" 
  ON public.bets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bets" 
  ON public.bets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bets" 
  ON public.bets FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bets" 
  ON public.bets FOR DELETE 
  USING (auth.uid() = user_id);

-- Horse racing bets policies
ALTER TABLE public.horse_racing_bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own horse racing bets" 
  ON public.horse_racing_bets FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.bets 
    WHERE bets.id = horse_racing_bets.bet_id 
    AND bets.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own horse racing bets" 
  ON public.horse_racing_bets FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bets 
    WHERE bets.id = horse_racing_bets.bet_id 
    AND bets.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own horse racing bets" 
  ON public.horse_racing_bets FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.bets 
    WHERE bets.id = horse_racing_bets.bet_id 
    AND bets.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own horse racing bets" 
  ON public.horse_racing_bets FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.bets 
    WHERE bets.id = horse_racing_bets.bet_id 
    AND bets.user_id = auth.uid()
  ));

-- Football bets policies
ALTER TABLE public.football_bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own football bets" 
  ON public.football_bets FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.bets 
    WHERE bets.id = football_bets.bet_id 
    AND bets.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own football bets" 
  ON public.football_bets FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bets 
    WHERE bets.id = football_bets.bet_id 
    AND bets.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own football bets" 
  ON public.football_bets FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.bets 
    WHERE bets.id = football_bets.bet_id 
    AND bets.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own football bets" 
  ON public.football_bets FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.bets 
    WHERE bets.id = football_bets.bet_id 
    AND bets.user_id = auth.uid()
  ));

-- Basketball bets policies
ALTER TABLE public.basketball_bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own basketball bets" 
  ON public.basketball_bets FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.bets 
    WHERE bets.id = basketball_bets.bet_id 
    AND bets.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own basketball bets" 
  ON public.basketball_bets FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bets 
    WHERE bets.id = basketball_bets.bet_id 
    AND bets.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own basketball bets" 
  ON public.basketball_bets FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.bets 
    WHERE bets.id = basketball_bets.bet_id 
    AND bets.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own basketball bets" 
  ON public.basketball_bets FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.bets 
    WHERE bets.id = basketball_bets.bet_id 
    AND bets.user_id = auth.uid()
  ));

-- User settings policies
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings" 
  ON public.user_settings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
  ON public.user_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
  ON public.user_settings FOR UPDATE 
  USING (auth.uid() = user_id);

-- AI interactions policies
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI interactions" 
  ON public.ai_interactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI interactions" 
  ON public.ai_interactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create functions and triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for bankrolls
CREATE TRIGGER update_bankrolls_updated_at
BEFORE UPDATE ON public.bankrolls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for horse_racing_bets
CREATE TRIGGER update_horse_racing_bets_updated_at
BEFORE UPDATE ON public.horse_racing_bets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for football_bets
CREATE TRIGGER update_football_bets_updated_at
BEFORE UPDATE ON public.football_bets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for basketball_bets
CREATE TRIGGER update_basketball_bets_updated_at
BEFORE UPDATE ON public.basketball_bets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for user_settings
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update bankroll amount when a bet is settled
CREATE OR REPLACE FUNCTION public.update_bankroll_on_bet_settlement()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status has changed to a settled state and profit_loss is set
  IF (OLD.status = 'pending' AND NEW.status != 'pending' AND NEW.profit_loss IS NOT NULL) THEN
    -- Update the bankroll's current amount
    UPDATE public.bankrolls
    SET current_amount = current_amount + NEW.profit_loss
    WHERE id = NEW.bankroll_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating bankroll on bet settlement
CREATE TRIGGER update_bankroll_on_bet_settlement
AFTER UPDATE ON public.bets
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.update_bankroll_on_bet_settlement();

-- Function to create default user settings on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  -- Create default bankroll
  INSERT INTO public.bankrolls (
    user_id, 
    name, 
    description, 
    initial_amount, 
    current_amount
  )
  VALUES (
    NEW.id, 
    'Default', 
    'Default bankroll created on signup', 
    1000, 
    1000
  )
  RETURNING id INTO NEW.default_bankroll_id;
  
  -- Update user settings with default bankroll
  UPDATE public.user_settings
  SET default_bankroll_id = NEW.default_bankroll_id
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user(); 