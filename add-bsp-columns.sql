-- Add missing BSP columns to master_results table
-- These columns will store Betfair BSP (Betfair Starting Price) data

ALTER TABLE master_results 
ADD COLUMN IF NOT EXISTS bsp NUMERIC(18,8),
ADD COLUMN IF NOT EXISTS ppwap NUMERIC(18,8),
ADD COLUMN IF NOT EXISTS morningwap NUMERIC(18,8),
ADD COLUMN IF NOT EXISTS ppmax NUMERIC(18,8),
ADD COLUMN IF NOT EXISTS ppmin NUMERIC(18,8),
ADD COLUMN IF NOT EXISTS ipmax NUMERIC(18,8),
ADD COLUMN IF NOT EXISTS ipmin NUMERIC(18,8),
ADD COLUMN IF NOT EXISTS morningtradedvol NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS pptradedvol NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS iptradedvol NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS total_traded_volume NUMERIC(18,2);

-- Add comments to document what each column contains
COMMENT ON COLUMN master_results.bsp IS 'Betfair Starting Price';
COMMENT ON COLUMN master_results.ppwap IS 'Pre-play Weighted Average Price';
COMMENT ON COLUMN master_results.morningwap IS 'Morning Weighted Average Price';
COMMENT ON COLUMN master_results.ppmax IS 'Pre-play Maximum Price';
COMMENT ON COLUMN master_results.ppmin IS 'Pre-play Minimum Price';
COMMENT ON COLUMN master_results.ipmax IS 'In-play Maximum Price';
COMMENT ON COLUMN master_results.ipmin IS 'In-play Minimum Price';
COMMENT ON COLUMN master_results.morningtradedvol IS 'Morning Traded Volume';
COMMENT ON COLUMN master_results.pptradedvol IS 'Pre-play Traded Volume';
COMMENT ON COLUMN master_results.iptradedvol IS 'In-play Traded Volume';
COMMENT ON COLUMN master_results.total_traded_volume IS 'Total Traded Volume (sum of morning + pre-play + in-play)'; 