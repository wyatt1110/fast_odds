/**
 * Test data for the Racing API integration
 * This file provides mock API responses for development and testing
 */

import { Horse, Race, Racecard } from './types';

// Sample horse data
export const testHorses: Horse[] = [
  {
    id: 'race123-horse1',
    name: 'Midnight Thunder',
    trainer: {
      id: 'trainer-001',
      name: 'John Smith'
    },
    jockey: {
      id: 'jockey-001',
      name: 'Tom Wilson'
    },
    age: 5,
    weight: '11-2',
    form: '1-3215',
    odds: '3/1',
  },
  {
    id: 'race123-horse2',
    name: 'Silver Arrow',
    trainer: {
      id: 'trainer-002',
      name: 'Emily Johnson'
    },
    jockey: {
      id: 'jockey-002',
      name: 'David Brown'
    },
    age: 6,
    weight: '10-8',
    form: '2-1435',
    odds: '5/1',
  },
  {
    id: 'race234-horse3',
    name: 'Golden Sunrise',
    trainer: {
      id: 'trainer-003',
      name: 'Robert Davis'
    },
    jockey: {
      id: 'jockey-003',
      name: 'Sarah Green'
    },
    age: 4,
    weight: '10-0',
    form: '3-1122',
    odds: '2/1',
  }
];

// Sample race data
export const testRaces: Race[] = [
  {
    id: 'race123',
    name: 'Cheltenham Gold Cup',
    course: {
      id: 'course-001',
      name: 'Cheltenham',
      country: 'GB'
    },
    date: '2023-05-12',
    time: '14:30',
    distance: '3m 2f 70y',
    class: 'Class 1',
    age_range: '5yo+',
    going: 'Good to Soft',
    prize_money: '£625,000',
    race_type: 'Chase',
    number_of_runners: 12,
    horses: [testHorses[0], testHorses[1]],
  },
  {
    id: 'race234',
    name: 'Grand National',
    course: {
      id: 'course-002',
      name: 'Aintree',
      country: 'GB'
    },
    date: '2023-04-15',
    time: '17:15',
    distance: '4m 2f 74y',
    class: 'Grade 3',
    age_range: '7yo+',
    going: 'Good',
    prize_money: '£1,000,000',
    race_type: 'Chase',
    number_of_runners: 40,
    horses: [testHorses[2]],
  }
];

// Sample racecard data (following theracingapi structure)
export const testRacecards: Racecard[] = [
  {
    race_id: 'race123',
    race_name: 'Cheltenham Gold Cup',
    course: {
      id: 'course-001',
      name: 'Cheltenham',
      country: 'GB'
    },
    date: '2023-05-12',
    time: '14:30',
    race_number: 3,
    distance: '3m 2f 70y',
    class: 'Class 1',
    age_range: '5yo+',
    going: 'Good to Soft',
    prize: '£625,000',
    race_type: 'Chase',
    number_of_runners: 12,
    horses: [
      {
        id: 'race123-horse1',
        name: 'Midnight Thunder',
        trainer: {
          id: 'trainer-001',
          name: 'John Smith'
        },
        jockey: {
          id: 'jockey-001',
          name: 'Tom Wilson'
        },
        age: 5,
        weight: '11-2',
        form: '1-3215',
        odds: '3/1',
      },
      {
        id: 'race123-horse2',
        name: 'Silver Arrow',
        trainer: {
          id: 'trainer-002',
          name: 'Emily Johnson'
        },
        jockey: {
          id: 'jockey-002',
          name: 'David Brown'
        },
        age: 6,
        weight: '10-8',
        form: '2-1435',
        odds: '5/1',
      }
    ],
  },
  {
    race_id: 'race234',
    race_name: 'Grand National',
    course: {
      id: 'course-002',
      name: 'Aintree',
      country: 'GB'
    },
    date: '2023-04-15',
    time: '17:15',
    race_number: 6,
    distance: '4m 2f 74y',
    class: 'Grade 3',
    age_range: '7yo+',
    going: 'Good',
    prize: '£1,000,000',
    race_type: 'Chase',
    number_of_runners: 40,
    horses: [
      {
        id: 'race234-horse3',
        name: 'Golden Sunrise',
        trainer: {
          id: 'trainer-003',
          name: 'Robert Davis'
        },
        jockey: {
          id: 'jockey-003',
          name: 'Sarah Green'
        },
        age: 4,
        weight: '10-0',
        form: '3-1122',
        odds: '2/1',
      }
    ],
  },
  {
    race_id: 'race345',
    race_name: 'Yorkshire Cup',
    course: {
      id: 'course-003',
      name: 'York',
      country: 'GB'
    },
    date: '2023-05-12',
    time: '15:35',
    race_number: 4,
    distance: '1m 6f',
    class: 'Group 2',
    age_range: '4yo+',
    going: 'Good to Firm',
    prize: '£200,000',
    race_type: 'Flat',
    number_of_runners: 8,
    horses: [
      {
        id: 'race345-horse4',
        name: 'Royal Fortune',
        trainer: {
          id: 'trainer-004',
          name: 'Michael White'
        },
        jockey: {
          id: 'jockey-004',
          name: 'James Taylor'
        },
        age: 5,
        weight: '9-2',
        form: '1-1432',
        odds: '7/2',
      }
    ],
  }
]; 