/**
 * Static location data for Maharashtra state.
 * Used across user-list, timelog-list, and user-form-modal.
 */
export const STATE_MAHARASHTRA = 'Maharashtra';

export const DISTRICTS = [
  'Amravati',
  'Akola',
  'Washim',
  'Buldhana',
  'Yavatmal'
] as const;

export type DistrictName = typeof DISTRICTS[number];

export const DISTRICT_TALUKAS: Record<string, string[]> = {
  Amravati: [
    'Amravati',
    'Achalpur',
    'Chandur Railway',
    'Chandur Bazar',
    'Warud',
    'Morshi',
    'Daryapur',
    'Anjangaon Surji',
    'Dharni',
    'Chikhaldara',
    'Bhatkuli',
    'Nandgaon Khandeshwar',
    'Tiosa',
    'Dhamangaon Railway'
  ],
  Akola: [
    'Akola',
    'Akot',
    'Balapur',
    'Barshitakli',
    'Murtijapur',
    'Patur',
    'Telhara'
  ],
  Washim: [
    'Washim',
    'Malegaon',
    'Risod',
    'Mangrulpir',
    'Karanja',
    'Manora'
  ],
  Buldhana: [
    'Buldhana',
    'Chikhli',
    'Mehkar',
    'Malkapur',
    'Jalgaon Jamod',
    'Khamgaon',
    'Shegaon',
    'Nandura',
    'Motala',
    'Sangrampur',
    'Lonar'
  ],
  Yavatmal: [
    'Yavatmal',
    'Pusad',
    'Umarkhed',
    'Digras',
    'Darwha',
    'Ner',
    'Kalamb',
    'Ralegaon',
    'Maregaon',
    'Ghatanji',
    'Babhulgaon',
    'Wani',
    'Arni',
    'Zari Jamani',
    'Mahagaon',
    'Pandharkawada'
  ]
};

/** Get talukas for a district by name. Returns empty array if district not found. */
export function getTalukasForDistrict(district: string): string[] {
  return DISTRICT_TALUKAS[district] || [];
}
