-- Drop existing table if it exists
DROP TABLE IF EXISTS public.odds;

-- Create fresh odds table
CREATE TABLE public.odds (
  id BIGSERIAL PRIMARY KEY,
  runner_id BIGINT NOT NULL,
  race_id TEXT NOT NULL,
  horse_id TEXT,

  -- Opening odds (TEXT for SP compatibility)
  bet365_opening TEXT,
  william_hill_opening TEXT,
  paddy_power_opening TEXT,
  sky_bet_opening TEXT,
  ladbrokes_opening TEXT,
  coral_opening TEXT,
  betfair_opening TEXT,
  betfred_opening TEXT,
  unibet_opening TEXT,
  bet_uk_opening TEXT,
  
  bet_goodwin_opening TEXT,
  bet_victor_opening TEXT,
  ten_bet_opening TEXT,
  seven_bet_opening TEXT,
  bet442_opening TEXT,
  betmgm_opening TEXT,
  betway_opening TEXT,
  boyle_sports_opening TEXT,
  copybet_opening TEXT,
  dragon_bet_opening TEXT,
  gentlemen_jim_opening TEXT,
  grosvenor_sports_opening TEXT,
  hollywood_bets_opening TEXT,
  matchbook_opening TEXT,
  midnite_opening TEXT,
  pricedup_bet_opening TEXT,
  quinn_bet_opening TEXT,
  sporting_index_opening TEXT,
  spreadex_opening TEXT,
  star_sports_opening TEXT,
  virgin_bet_opening TEXT,
  talksport_bet_opening TEXT,
  betfair_exchange_opening TEXT,

  -- Historical odds (JSONB arrays)
  bet365_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  william_hill_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  paddy_power_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  sky_bet_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  ladbrokes_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  coral_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  betfair_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  betfred_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  unibet_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  bet_uk_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  bet_goodwin_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  bet_victor_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  ten_bet_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  seven_bet_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  bet442_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  betmgm_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  betway_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  boyle_sports_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  copybet_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  dragon_bet_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  gentlemen_jim_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  grosvenor_sports_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  hollywood_bets_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  matchbook_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  midnite_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  pricedup_bet_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  quinn_bet_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  sporting_index_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  spreadex_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  star_sports_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  virgin_bet_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  talksport_bet_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  betfair_exchange_history JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unique constraint for upserts
  UNIQUE (race_id, horse_id)
);

-- Indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_odds_runner_id ON public.odds (runner_id);
CREATE INDEX IF NOT EXISTS idx_odds_race_id ON public.odds (race_id);
CREATE INDEX IF NOT EXISTS idx_odds_updated_at ON public.odds (updated_at); 