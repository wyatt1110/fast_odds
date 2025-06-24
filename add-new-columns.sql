-- Add new jockey and trainer columns to master_results table
-- Jockey statistics columns (from runners table)
ALTER TABLE master_results ADD COLUMN jockey_lifetime TEXT;
ALTER TABLE master_results ADD COLUMN jockey_12_months TEXT;
ALTER TABLE master_results ADD COLUMN jockey_3_months TEXT;
ALTER TABLE master_results ADD COLUMN jockey_trainer TEXT;
ALTER TABLE master_results ADD COLUMN jockey_trainer_3_months TEXT;
ALTER TABLE master_results ADD COLUMN jockey_course TEXT;
ALTER TABLE master_results ADD COLUMN jockey_owner TEXT;

-- Trainer statistics columns (from runners table)
ALTER TABLE master_results ADD COLUMN trainer_lifetime TEXT;
ALTER TABLE master_results ADD COLUMN trainer_12_months TEXT;
ALTER TABLE master_results ADD COLUMN trainer_3_months TEXT;
ALTER TABLE master_results ADD COLUMN trainer_course TEXT;
ALTER TABLE master_results ADD COLUMN trainer_jockey TEXT;
ALTER TABLE master_results ADD COLUMN trainer_jockey_3_months TEXT;
ALTER TABLE master_results ADD COLUMN trainer_owner TEXT;

-- Timeform data columns (from timeform table)
ALTER TABLE master_results ADD COLUMN timeform_rating TEXT;
ALTER TABLE master_results ADD COLUMN pacemap_1 TEXT;
ALTER TABLE master_results ADD COLUMN pacemap_2 TEXT;
ALTER TABLE master_results ADD COLUMN pace_forecast TEXT;
ALTER TABLE master_results ADD COLUMN draw_bias TEXT;
ALTER TABLE master_results ADD COLUMN specific_pace_hint TEXT;

-- Last time out and average figures (calculated from timeform table)
ALTER TABLE master_results ADD COLUMN lto_adj_tfr NUMERIC;
ALTER TABLE master_results ADD COLUMN avr_adj_tfr NUMERIC;
ALTER TABLE master_results ADD COLUMN lto_tfig NUMERIC;
ALTER TABLE master_results ADD COLUMN avr_tfig NUMERIC;
ALTER TABLE master_results ADD COLUMN lto_tfr NUMERIC;
ALTER TABLE master_results ADD COLUMN avr_tfr NUMERIC; 