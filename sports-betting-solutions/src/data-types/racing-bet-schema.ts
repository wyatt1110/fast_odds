/**
 * Racing Bets Table Schema Knowledge Base
 * This file documents the structure and purpose of each column in the racing_bets table
 * 
 * CRITICAL SECURITY REQUIREMENTS:
 * 1. User ID verification is MANDATORY for ALL operations
 * 2. Every bet MUST have a matching user_id to the user making the request
 * 3. Editing bets is ONLY allowed if user_id matches the requesting user
 * 4. NO EXCEPTIONS to these user_id rules are permitted
 * 
 * MULTIPLE BETS HANDLING:
 * 1. Multiple horses in a single bet are separated by '&' in relevant fields
 * 2. The order of entries must be consistent across all fields (first horse's details first, etc.)
 * 3. For multiples (doubles, trebles, etc.), ALL race/horse-specific fields must contain the same number of entries
 * 4. Fields that must contain & separators for multiples:
 *    - track_name (if different tracks)
 *    - race_number
 *    - scheduled_race_time
 *    - class_type
 *    - purse
 *    - distance
 *    - horse_name
 *    - post_position
 *    - jockey
 *    - trainer
 *    - morning_line_odds
 * 5. Fields that remain single values for multiples:
 *    - race_date (must be same day)
 *    - stake
 *    - odds (combined odds)
 *    - status
 *    - returns
 *    - profit_loss
 *    - bookmaker
 *    - model
 * 6. For E/W multiples, paying places are also separated by & (e.g., "4 & 3" for different place terms)
 * 7. E/W multiples split the total stake equally between win and place parts
 * 
 * AI Agent Responsibility:
 * The AI agent is responsible for collecting and filling all fields except:
 * - closing_odds
 * - closing_line_value
 * - rule_4_applied
 * - rule_4_deduction
 * - rule_4_adjusted_odds
 * - fin_pos
 * 
 * Fields not handled during initial bet recording (only during editing):
 * - returns (requires knowing race result)
 * - profit_loss (requires knowing race result)
 * 
 * These fields are handled by separate premium features or require race results.
 */

export const RACING_BETS_SCHEMA = {
  // SECURITY CRITICAL - Core Identifiers
  user_id: {
    type: 'uuid',
    required: true,
    description: 'CRITICAL: Reference to the user who placed the bet. MUST match the requesting user for ALL operations.',
    example: 'user_uuid',
    ai_collected: false,
    security_note: 'MANDATORY verification required. No exceptions.'
  },
  id: {
    type: 'uuid',
    required: true,
    description: 'Unique identifier for each bet, automatically generated',
    example: 'uuid_generate_v4()',
    ai_collected: false
  },

  // Basic Race Information
  track_name: {
    type: 'text',
    required: true,
    description: 'Name of the racetrack(s). Must use & separator for different tracks in multiples',
    example: 'Cheltenham & Ascot',
    ai_collected: true,
    multiple_note: 'MUST contain same number of entries as horses for multiples'
  },
  race_number: {
    type: 'text',
    required: false,
    description: 'The number of the race(s). Must use & separator for multiples',
    example: '4 & 5',
    ai_collected: true,
    multiple_note: 'MUST contain same number of entries as horses for multiples'
  },
  race_date: {
    type: 'date',
    required: true,
    description: 'The date when the race takes place',
    example: '2024-03-15',
    ai_collected: true
  },
  scheduled_race_time: {
    type: 'text',
    required: false,
    description: 'The scheduled post time(s) for the race(s). Must use & separator for multiples',
    example: '14:30 & 15:05',
    ai_collected: true,
    multiple_note: 'MUST contain same number of entries as horses for multiples'
  },
  race_location: {
    type: 'text',
    required: false,
    description: 'The country where the race is taking place',
    example: 'UK',
    ai_collected: true
  },

  // Race Details
  class_type: {
    type: 'text',
    required: false,
    description: 'The type of each race. Must use & separator for multiples',
    example: 'Handicap & Grade 1',
    ai_collected: true,
    multiple_note: 'MUST contain same number of entries as horses for multiples'
  },
  purse: {
    type: 'text',
    required: false,
    description: 'Total prize money for each race. Must use & separator for multiples',
    example: '100000 & 250000',
    ai_collected: true,
    multiple_note: 'MUST contain same number of entries as horses for multiples'
  },
  distance: {
    type: 'text',
    required: false,
    description: 'Race distance for each race. Must use & separator for multiples',
    example: '8.0 & 12.0',
    ai_collected: true,
    multiple_note: 'MUST contain same number of entries as horses for multiples'
  },

  // Bet Details
  bet_type: {
    type: 'text',
    required: true,
    description: 'The type of bet placed. For multiples, specifies number of selections (e.g., Single, Double, Treble, 4 Fold)',
    example: 'Double',
    valid_values: ['Single', 'Double', 'Treble', '4 Fold', '5 Fold', '6 Fold', '7 Fold', '8 Fold', 'Each Way'],
    ai_collected: true,
    multiple_note: 'For multiples, all related fields will contain multiple entries separated by &'
  },
  stake: {
    type: 'numeric',
    required: true,
    description: 'The amount wagered (number only, no currency/points/percentage symbols). For multiples, this is the total stake for the entire bet. For E/W bets, this is the total combined stake (e.g., 10 for a £5 E/W double)',
    example: '50',
    ai_collected: true,
    multiple_note: 'For E/W multiples, stake is split equally between win and place parts'
  },
  odds: {
    type: 'numeric',
    required: true,
    description: 'The odds taken at the time of placing the bet (in decimal format). For multiples, this is the combined odds of all selections.',
    example: '27.50',
    ai_collected: true,
    multiple_note: 'Individual odds are stored in notes field for reference'
  },
  each_way: {
    type: 'text',
    required: false,
    default: null,
    description: 'For E/W bets, stores the number of paying places. For multiple E/W bets, places are separated by & if different',
    example: '4 & 3',
    ai_collected: true,
    multiple_note: 'Order must match horse_name order. Use same number if all races have same places.'
  },

  // Bet Status
  status: {
    type: 'USER-DEFINED',
    required: true,
    default: 'Pending',
    description: 'Current status of the bet. Always Pending during initial recording.',
    valid_values: ['Pending', 'Won', 'Lost', 'Void', 'Part Won'],
    example: 'Pending',
    ai_collected: true
  },
  returns: {
    type: 'numeric',
    required: false,
    description: 'Total amount returned including stake if bet won (number only). Not set during initial recording.',
    example: '275',
    ai_collected: false,
    note: 'Only set when updating bet with results'
  },
  profit_loss: {
    type: 'numeric',
    required: false,
    description: 'The profit or loss from the bet (negative for losses, number only). Not set during initial recording.',
    example: '225',
    ai_collected: false,
    note: 'Only set when updating bet with results'
  },

  // Premium Features (Not handled by AI agent)
  closing_odds: {
    type: 'numeric',
    required: false,
    description: 'The final odds at race start time',
    example: '4.00',
    ai_collected: false
  },
  closing_line_value: {
    type: 'numeric',
    required: false,
    description: 'The difference between taken odds and closing odds',
    example: '0.50',
    ai_collected: false
  },
  fin_pos: {
    type: 'integer',
    required: false,
    description: 'The finishing position of the horse in the race',
    example: '1',
    ai_collected: false
  },
  rule_4_applied: {
    type: 'boolean',
    required: false,
    default: false,
    description: 'Indicates if a Rule 4 deduction was applied',
    example: 'true',
    ai_collected: false
  },
  rule_4_deduction: {
    type: 'numeric',
    required: false,
    description: 'The amount of Rule 4 deduction applied (decimal)',
    example: '0.20',
    ai_collected: false
  },
  rule_4_adjusted_odds: {
    type: 'numeric',
    required: false,
    description: 'The odds after Rule 4 deduction is applied',
    example: '3.60',
    ai_collected: false
  },

  // Additional Information
  model: {
    type: 'text',
    required: false,
    description: 'Optional category to track different betting systems/tipsters separately. Always a single value even for multiples.',
    example: 'UK Value Tips',
    ai_collected: true,
    multiple_note: 'Single value for entire bet, no & separator used'
  },
  bookmaker: {
    type: 'text',
    required: false,
    description: 'The bookmaker where the bet was placed',
    example: 'Bet365',
    ai_collected: true
  },
  notes: {
    type: 'text',
    required: false,
    description: 'Additional notes including individual odds and race details for multiples',
    example: 'E/W Double: Galvin (4.0, Grade 1, 2m4f, 4 places) & Jonbon (6.0, Handicap, 3m, 3 places) = Combined odds 27.5. Total stake £10 E/W (£5 win double, £5 place double)',
    ai_collected: true
  },

  // Timestamps
  created_at: {
    type: 'timestamp with time zone',
    required: true,
    default: 'now()',
    description: 'When the bet was created',
    example: '2024-03-15T14:30:00Z',
    ai_collected: false
  },
  updated_at: {
    type: 'timestamp with time zone',
    required: true,
    default: 'now()',
    description: 'When the bet was last updated',
    example: '2024-03-15T14:30:00Z',
    ai_collected: false
  },

  // Race and Horse Details
  horse_name: {
    type: 'text',
    required: true,
    description: 'Name of the horse(s). For multiples, horses are separated by & in order of races',
    example: 'Galvin & Jonbon',
    ai_collected: true,
    multiple_note: 'Order must match across all fields'
  },
  post_position: {
    type: 'integer',
    required: false,
    description: 'The starting gate/stall position of the horse',
    example: '6',
    ai_collected: true
  },
  jockey: {
    type: 'text',
    required: false,
    description: 'Name of the jockey(s). For multiples, separated by & in same order as horses',
    example: 'J W Kennedy & N De Boinville',
    ai_collected: true,
    multiple_note: 'Order must match horse_name order'
  },
  trainer: {
    type: 'text',
    required: false,
    description: 'Name of the trainer(s). For multiples, separated by & in same order as horses',
    example: 'Gordon Elliott & Nicky Henderson',
    ai_collected: true,
    multiple_note: 'Order must match horse_name order'
  },
  morning_line_odds: {
    type: 'numeric',
    required: false,
    description: 'The early morning/overnight odds (always stored in decimal format, converted from fractional if needed)',
    example: '3.50',
    ai_collected: true
  }
};

// Export valid status options for use in validation
export const VALID_BET_STATUSES = ['Pending', 'Won', 'Lost', 'Void', 'Part Won'];

// Export valid bet types for use in validation
export const VALID_BET_TYPES = ['Single', 'Double', 'Treble', '4 Fold', '5 Fold', '6 Fold', '7 Fold', '8 Fold', 'Each Way'];

// Security verification constants
export const SECURITY_RULES = {
  USER_ID_REQUIRED: true,
  VERIFY_USER_MATCH: true,
  EDIT_REQUIRES_USER_MATCH: true,
  NO_CROSS_USER_ACCESS: true
}; 