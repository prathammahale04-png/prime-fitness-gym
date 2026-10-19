export interface Trainer {
  id: string;
  name: string;
  role: string;
  specialty: string;
  image: string;
  bio: string;
}

export interface PricingPlan {
  id: string;
  durationNumber: string;
  durationUnit: string;
  price: string;
  highlighted?: boolean;
  features: string[];
}

export const PRIME_GYM_DATA = {
  brandName: 'PRIME FITNESS',
  city: 'JALGAON',
  fullTitle: 'PRIME FITNESS | JALGAON',
  timings: '5–10 AM | 4:30–10 PM',
  facilitySize: '4000+ SQ.FT.',
  disciplines: 'Strength • Cardio • HYROX • Powerlifting',
  disciplinesList: ['Strength', 'Cardio', 'HYROX', 'Powerlifting'],
  locationShort: 'Shivaji Nagar, Jalgaon',
  fullAddress: 'Saawariya godown Front of Makra tower , near Vikas dudh federation , Shivaji Nagar , Jalgaon, Jalgaon 425001',
  phone: '+91 94222 19019',
  email: 'primefitnessjalgaon@gmail.com',
  instagram: '@primefitness_mh19',
  instagramUrl: 'https://www.instagram.com/primefitness_mh19/',
};

import trainerStrengthImg from '../assets/images/facility_strength_zone_1791890949054.jpg';
import trainerHyroxImg from '../assets/images/trainer_hyrox_female_1792235874601.jpg';
import trainerTurfImg from '../assets/images/facility_functional_turf_1791890950007.jpg';
import trainerCardioImg from '../assets/images/facility_cardio_deck_1791890948475.jpg';
import trainerOlyImg from '../assets/images/exhibition_barbell_knurling_1791892495905.jpg';

export const TRAINERS: Trainer[] = [
  {
    id: 'trainer-1',
    name: 'AMIT PATIL',
    role: 'Strength & Powerlifting Coach',
    specialty: 'Powerlifting',
    image: trainerStrengthImg || '/images/facility_strength_zone_1791890949054.jpg',
    bio: 'State powerlifting medalist specializing in heavy compound mechanics, squat & deadlift lockout technique.',
  },
  {
    id: 'trainer-2',
    name: 'SARA CAVIL',
    role: 'Head HYROX & Conditioning Coach',
    specialty: 'HYROX & MetCon',
    image: trainerHyroxImg || '/images/trainer_hyrox_female_1792235874601.jpg',
    bio: 'Certified HYROX master trainer and functional conditioning coach with 8+ years coaching athletes.',
  },
  {
    id: 'trainer-3',
    name: 'VIKRAM JADHAV',
    role: 'Senior Transformation Specialist',
    specialty: 'Hypertrophy & Fat Loss',
    image: trainerTurfImg || '/images/facility_functional_turf_1791890950007.jpg',
    bio: 'Precision hypertrophy programmer with focus on biomechanics, progressive overload and nutrition tracking.',
  },
  {
    id: 'trainer-4',
    name: 'NEHA RATHOD',
    role: 'Cardio & Aerobic Endurance Coach',
    specialty: 'Cardio & Agility',
    image: trainerCardioImg || '/images/facility_cardio_deck_1791890948475.jpg',
    bio: 'High-intensity interval trainer dedicated to aerobic threshold building, VO2 max and core stability.',
  },
  {
    id: 'trainer-5',
    name: 'RAHUL SHINDE',
    role: 'Olympic Lifting & Mobility Coach',
    specialty: 'Olympic Lifting',
    image: trainerOlyImg || '/images/exhibition_barbell_knurling_1791892495905.jpg',
    bio: 'Expert in shoulder stability, hip mobility, clean & jerk velocity and injury-free longevity.',
  },
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'plan-1-month',
    durationNumber: '1',
    durationUnit: 'MONTH',
    price: '1,500',
    features: [
      'Full 4000+ Sq.Ft. gym access',
      'Strength & Cardio deck workouts',
      'HYROX & functional turf zone',
      'Initial coach consultation & form check',
    ],
  },
  {
    id: 'plan-3-months',
    durationNumber: '3',
    durationUnit: 'MONTHS',
    price: '3,800',
    highlighted: true,
    features: [
      'Full 4000+ Sq.Ft. gym access',
      'Strength & Cardio deck workouts',
      'HYROX & Powerlifting platforms',
      'Personalized workout routine & diet tips',
      'Locker & shower facilities included',
    ],
  },
  {
    id: 'plan-6-months',
    durationNumber: '6',
    durationUnit: 'MONTHS',
    price: '6,500',
    features: [
      'Full 4000+ Sq.Ft. gym access',
      'Unlimited Strength, Cardio & HYROX',
      'Bi-weekly progress & composition audits',
      'Dedicated personal trainer support',
      'Recovery & stretch sessions',
    ],
  },
  {
    id: 'plan-1-year',
    durationNumber: '1',
    durationUnit: 'YEAR',
    price: '11,500',
    features: [
      'Full 365-day uncrowded priority access',
      'All disciplines: Strength, Cardio, HYROX, Powerlifting',
      'Full personalized nutrition & training regimen',
      'Priority locker reservation & gear storage',
      '2 free guest passes per quarter',
    ],
  },
];
