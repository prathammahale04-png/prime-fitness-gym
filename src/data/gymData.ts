export interface StoryTenet {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  metric: string;
  metricLabel: string;
}

export interface ExhibitionZone {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  category: string;
  image: string;
  specs: string[];
  dimensions?: string;
  notes: string;
}

export interface DisciplineItem {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  overview: string;
  focusAreas: string[];
  equipmentFocus: string;
}

export const GYM_DETAILS = {
  brandName: 'PRIME FITNESS',
  code: 'MH19',
  fullName: 'Prime Fitness MH19',
  motto: 'BUILT DIFFERENT.',
  heroStatement: 'YOUR NEXT LEVEL STARTS HERE.',
  subStatement: 'Train with purpose. Build strength. Become your best.',
  coordinates: '21.0077° N, 75.5626° E',
  region: 'Jalgaon (MH-19), Maharashtra, India',
  instagramHandle: '@primefitness_mh19',
  instagramUrl: 'https://www.instagram.com/primefitness_mh19/',
  addressPlaceholder: 'Prime Fitness MH19, Jalgaon, Maharashtra 425001 [Exact address to be confirmed by owner]',
  phonePlaceholder: '+91 98XXX XXXXX',
  whatsappPlaceholder: '919800000000',
  operatingHours: {
    weekdays: '06:00 – 11:00 & 17:00 – 22:00',
    saturday: '06:00 – 11:00 & 17:00 – 21:00',
    sunday: '07:00 – 11:00 (Special Conditioning)',
  },
  studioCredit: 'Nexora Studio',
};

export const STORY_TENETS: StoryTenet[] = [
  {
    id: 'tenet-01',
    number: '01',
    title: 'CALIBRATED RESISTANCE',
    subtitle: 'THE TEMPLE OF RAW STEEL',
    description: 'No plastic selectorized toys or wobbling racks. Every barbell, plate, and power cage at Prime Fitness is calibrated for maximum load stability and uncompromising biomechanical safety.',
    image: '/src/assets/images/facility_strength_zone_1791890949054.jpg',
    metric: '100% RAW',
    metricLabel: 'Steel Platforms & Heavy Cages',
  },
  {
    id: 'tenet-02',
    number: '02',
    title: 'METABOLIC VELOCITY',
    subtitle: 'THE CARDIO & ENDURANCE DECK',
    description: 'High-velocity conditioning engineered to push lactic thresholds. Commercial motor treadmills, air ergs, and rowers configured for interval output without knee or joint compromise.',
    image: '/src/assets/images/facility_cardio_deck_1791890948475.jpg',
    metric: 'ZERO DRAG',
    metricLabel: 'Commercial Aerobic Precision',
  },
  {
    id: 'tenet-03',
    number: '03',
    title: 'ATHLETIC INTENT',
    subtitle: 'HIGH-DENSITY TURF & SLED TRACK',
    description: 'Sprint lanes, heavy prowlers, battle ropes, and competition kettlebells. Built for multidirectional agility, raw posterior chain development, and explosive athletic power.',
    image: '/src/assets/images/facility_functional_turf_1791890950007.jpg',
    metric: 'UNFILTERED',
    metricLabel: 'Sled Pushes & Power Circuits',
  },
];

export const EXHIBITION_ZONES: ExhibitionZone[] = [
  {
    id: 'zone-cages',
    code: 'ZONE 01',
    title: 'HEAVY POWER CAGES & SQUAT PLATFORMS',
    subtitle: 'Olympic Free Weights & Rigging',
    category: 'STRENGTH',
    image: '/src/assets/images/facility_strength_zone_1791890949054.jpg',
    specs: ['Commercial Olympic Barbells', 'Calibrated Steel & Bumper Plates', 'Heavy-Duty Safety Spotter Arms', 'Zero-Slip Hardwood Lifting Decks'],
    dimensions: 'Primary Heavy Lifting Floor',
    notes: 'Configured for deadlifts, squats, bench presses, and heavy rows with zero vibration feedback.',
  },
  {
    id: 'zone-macro',
    code: 'ZONE 02',
    title: 'KNURLED STEEL & CHALK STATIONS',
    subtitle: 'Tactile Grip & Zero Compromise',
    category: 'DETAILS',
    image: '/src/assets/images/exhibition_barbell_knurling_1791892495905.jpg',
    specs: ['Aggressive Hill Knurl Patterns', 'Magnesium Chalk Dispensers', 'Heavy Dumbbell Racks', 'Calibrated Collars & Bands'],
    dimensions: 'Precision Hand Contact',
    notes: 'True tactile equipment feel. High friction knurl ensures firm lockout under maximum loading.',
  },
  {
    id: 'zone-turf',
    code: 'ZONE 03',
    title: 'FUNCTIONAL SLED TURF & SPRINT TRACK',
    subtitle: 'Athletic Conditioning & Agility',
    category: 'SPEED & METCON',
    image: '/src/assets/images/facility_functional_turf_1791890950007.jpg',
    specs: ['High-Friction Indoor Sprint Turf', 'Heavy Prowler Push/Pull Sleds', 'Competition Russian Kettlebells', 'Heavy Poly Battle Ropes'],
    dimensions: 'High-Density Turf Strip',
    notes: 'Engineered for sled pulls, plyometric bounds, farmer walks, and conditioning finishers.',
  },
  {
    id: 'zone-cardio',
    code: 'ZONE 04',
    title: 'COMMERCIAL CARDIO & ERG DECK',
    subtitle: 'Aerobic Power & Endurance',
    category: 'CARDIO',
    image: '/src/assets/images/facility_cardio_deck_1791890948475.jpg',
    specs: ['High-Impact Cushion Treadmills', 'Air Rowers & Ski Ergometers', 'Assault Air Bikes', 'Heart-Rate Biometric Readouts'],
    dimensions: 'Aerobic Conditioning Bay',
    notes: 'Low-impact ergonomics with variable resistance for high-intensity interval training.',
  },
  {
    id: 'zone-lounge',
    code: 'ZONE 05',
    title: 'COACHING SUITE & RECOVERY CORRIDOR',
    subtitle: 'Consultation & Secure Lockers',
    category: 'RECOVERY',
    image: '/src/assets/images/exhibition_recovery_lounge_1791892496637.jpg',
    specs: ['Matte Black Secure Lockers', '1-on-1 Consultation Desk', 'Ambient Recovery Lighting', 'Clean Changing Facilities'],
    dimensions: 'Rest & Assessment Quarter',
    notes: 'Quiet environment for physique assessments, body composition tracking, and nutrition consultations.',
  },
];

export const DISCIPLINES: DisciplineItem[] = [
  {
    id: 'disc-hypertrophy',
    index: '01',
    title: 'HYPERTROPHY & ABSOLUTE STRENGTH',
    subtitle: 'Periodized Compound Progression',
    overview: 'Structured around fundamental compound movements (Squat, Bench, Deadlift, Overhead Press) paired with high-yield accessory hypertrophy to build lean dense muscle mass.',
    focusAreas: ['Progressive Overload Tracking', 'Form Breakdown & Mechanical Efficiency', 'Weak-Point Elimination & Grip Strength'],
    equipmentFocus: 'Olympic Barbells, Heavy Dumbbells, Incline Platforms',
  },
  {
    id: 'disc-transformation',
    index: '02',
    title: 'BODY RECOMPOSITION & FAT LOSS',
    subtitle: 'Accelerated Metabolic Remodeling',
    overview: 'A science-backed protocol combining caloric deficit management, dense resistance training, and interval conditioning to preserve lean muscle while stripping body fat.',
    focusAreas: ['Targeted Macronutrient Frameworks', 'Non-Exercise Activity (NEAT) Accountability', 'Weekly Biometric & Measurement Audits'],
    equipmentFocus: 'Free Weights, Functional Turf, Biometric Assessment',
  },
  {
    id: 'disc-conditioning',
    index: '03',
    title: 'ATHLETIC POWER & FUNCTIONAL SPEED',
    subtitle: 'Multi-Planar Conditioning',
    overview: 'Engineered for individuals who want to move like an athlete. Integrates sled pushes, plyometrics, rotational core stability, and stamina conditioning.',
    focusAreas: ['Lactic Acid Threshold Conditioning', 'Core & Posterior Chain Fortification', 'Injury Prevention & Joint Mobility'],
    equipmentFocus: 'Sprint Turf, Prowlers, Kettlebells, Air Ergs',
  },
];
