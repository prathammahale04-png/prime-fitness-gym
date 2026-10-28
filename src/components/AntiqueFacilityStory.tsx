import React, { useRef, useState, useEffect } from 'react';
import { useGsapAnimation } from '../hooks/useGsapAnimation';
import { gsap, isReducedMotionPreferred } from '../utils/gsapSetup';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

import arenaStrengthImg from '../assets/images/facility_strength_zone_1791890949054.jpg';
import arenaTurfImg from '../assets/images/facility_functional_turf_1791890950007.jpg';
import arenaCardioImg from '../assets/images/facility_cardio_deck_1791890948475.jpg';
import arenaOlyImg from '../assets/images/exhibition_barbell_knurling_1791892495905.jpg';

interface ArenaStoryItem {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  discipline: string;
  specs: string[];
  description: string;
  image: string;
}

const ARENA_ITEMS: ArenaStoryItem[] = [
  {
    id: 'arena-strength',
    number: '01',
    title: 'STRENGTH & POWERLIFTING DECK',
    subtitle: 'HEAVY COMPOUND PLATFORMS',
    discipline: 'Powerlifting · Progressive Overload',
    specs: ['Eleiko-spec calibrated plates', 'Full Olympic squat racks', 'Deadlift drop platforms', 'Barbell velocity cameras'],
    description: 'Built for uncompromising mechanical force. Heavy compound platforms dedicated to squat, bench press, and deadlift velocity without queuing.',
    image: arenaStrengthImg || '/images/facility_strength_zone_1791890949054.jpg',
  },
  {
    id: 'arena-turf',
    number: '02',
    title: 'FUNCTIONAL HYROX TURF',
    subtitle: 'ATHLETIC SPEED & SLED TRACK',
    discipline: 'HYROX · High-Velocity Conditioning',
    specs: ['Continuous high-density turf', 'Competition-weighted sleds', 'Rogue cast-iron kettlebells', 'Plyometric vault boxes'],
    description: 'A 25-meter sprint and sled-push runway designed specifically for HYROX race simulations, farmer carries, and explosive power output.',
    image: arenaTurfImg || '/images/facility_functional_turf_1791890950007.jpg',
  },
  {
    id: 'arena-cardio',
    number: '03',
    title: 'CARDIO ENGINE DECK',
    subtitle: 'AEROBIC THRESHOLD TRAINING',
    discipline: 'VO2 Max · Metabolic Conditioning',
    specs: ['Concept2 rowers & SkiErgs', 'Curved motorless slat treadmills', 'High-inertia air bikes', 'Real-time telemetry displays'],
    description: 'Motorless curved slat treadmills and assault bikes engineered for maximal cardiovascular output with reduced impact forces on connective tissue.',
    image: arenaCardioImg || '/images/facility_cardio_deck_1791890948475.jpg',
  },
  {
    id: 'arena-oly',
    number: '04',
    title: 'OLYMPIC LIFTING & MOBILITY',
    subtitle: 'KINEMATICS & LONGEVITY',
    discipline: 'Olympic Lifting · Joint Longevity',
    specs: ['Precision laser-knurled bars', 'Vibration-damped drop bays', 'Active mobility band station', 'Percussion therapy tools'],
    description: 'Biomechanical precision zone. Develop clean & jerk velocity, snatch stability, overhead shoulder mobility, and resilient connective tissue.',
    image: arenaOlyImg || '/images/exhibition_barbell_knurling_1791892495905.jpg',
  },
];

interface AntiqueFacilityStoryProps {
  onExplorePlans?: () => void;
  onClaimPass?: () => void;
}

export const AntiqueFacilityStory: React.FC<AntiqueFacilityStoryProps> = ({ onExplorePlans, onClaimPass }) => {
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0);
  const [isReduced, setIsReduced] = useState(() => isReducedMotionPreferred());
  const horizontalTrackRef = useRef<HTMLDivElement | null>(null);
  const mobileScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setIsReduced(mq.matches);
    try {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } catch {
      mq.addListener?.(handler);
      return () => mq.removeListener?.(handler);
    }
  }, []);

  const containerRef = useGsapAnimation<HTMLElement>((_ctx) => {
    // Only engage pinning on desktop screens (>= 1024px) when reduced motion is not preferred
    if (typeof window !== 'undefined' && window.innerWidth >= 1024 && !isReducedMotionPreferred()) {
      const track = horizontalTrackRef.current;
      if (!track) return;

      const totalScrollWidth = track.scrollWidth - track.clientWidth;

      if (totalScrollWidth > 0) {
        gsap.to(track, {
          x: -totalScrollWidth,
          ease: 'none',
          scrollTrigger: {
            trigger: '#facility',
            pin: true,
            scrub: 0.8,
            start: 'top top',
            end: () => `+=${totalScrollWidth * 1.15}`,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
      }
    }
  });

  const handleMobileScroll = () => {
    if (mobileScrollRef.current) {
      const { scrollLeft, clientWidth } = mobileScrollRef.current;
      const idx = Math.round(scrollLeft / (clientWidth * 0.85));
      setMobileActiveIndex(Math.min(idx, ARENA_ITEMS.length - 1));
    }
  };

  const scrollToMobileIndex = (index: number) => {
    if (mobileScrollRef.current) {
      const cardWidth = mobileScrollRef.current.clientWidth * 0.88;
      mobileScrollRef.current.scrollTo({
        left: index * cardWidth,
        behavior: isReduced ? 'auto' : 'smooth',
      });
      setMobileActiveIndex(index);
    }
  };

  const handleCtaClick = () => {
    if (onClaimPass) onClaimPass();
    else if (onExplorePlans) onExplorePlans();
  };

  return (
    <section
      id="facility"
      ref={containerRef}
      className="bg-[#0e1014] text-white py-16 sm:py-24 overflow-hidden relative"
    >
      {/* Anchor for legacy or alternate URL links */}
      <span id="facility-story" className="sr-only" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 mb-10 sm:mb-14">
        {/* Editorial Subheading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-headline uppercase tracking-[0.25em] text-[#f36b22] mb-2 font-bold">
              <span>FACILITY ARCHITECTURE</span>
              <span>·</span>
              <span>4000+ SQ.FT. SANCTUARY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-black uppercase tracking-tight text-white">
              DISCIPLINES & ARENAS
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 font-editorial max-w-md sm:text-right">
            Every square foot is purpose-built with elite biomechanical specifications in Shivaji Nagar, Jalgaon.
          </p>
        </div>
      </div>

      {/* Desktop Horizontal Scroll Storytelling Track (>= 1024px) */}
      <div className={`hidden lg:block w-full ${isReduced ? 'overflow-x-auto pb-6' : 'overflow-hidden'}`}>
        <div
          ref={horizontalTrackRef}
          className="flex gap-8 px-12 will-change-transform"
          style={{ width: 'fit-content' }}
        >
          {ARENA_ITEMS.map((item) => (
            <div
              key={item.id}
              className="w-[820px] shrink-0 bg-[#14161d] border border-neutral-800 hover:border-[#f36b22]/50 transition-colors duration-500 overflow-hidden flex flex-col group shadow-2xl"
            >
              <div className="grid grid-cols-12 h-[460px]">
                {/* Left Side: Photo with Subtle Zoom on Hover */}
                <div className="col-span-7 relative overflow-hidden bg-neutral-900">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover filter grayscale contrast-110 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 pointer-events-none select-none"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-4 left-4 px-2.5 py-1 bg-black/80 border border-neutral-700 text-white font-mono font-bold text-xs">
                    {item.number} / 04
                  </div>
                </div>

                {/* Right Side: Editorial Specs & Description */}
                <div className="col-span-5 p-7 flex flex-col justify-between bg-[#14161d]">
                  <div>
                    <span className="text-[10px] font-headline uppercase tracking-[0.2em] text-[#f36b22] font-bold block mb-1">
                      {item.subtitle}
                    </span>
                    <h3 className="text-xl font-headline font-black uppercase text-white leading-tight mb-3">
                      {item.title}
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed font-editorial mb-5">
                      {item.description}
                    </p>

                    <div className="space-y-1.5 pt-3 border-t border-neutral-800/80">
                      <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                        Engineered Specifications:
                      </span>
                      {item.specs.map((spec, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-2 text-[11px] text-neutral-300">
                          <span className="w-1 h-1 rounded-full bg-[#f36b22]" />
                          <span>{spec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {(onClaimPass || onExplorePlans) && (
                    <button
                      onClick={handleCtaClick}
                      className="group/btn inline-flex items-center gap-2 text-xs font-headline font-bold uppercase tracking-[0.15em] text-[#f36b22] hover:text-white transition-colors cursor-pointer pt-4 border-t border-neutral-800"
                    >
                      <span>Claim Free Trial Pass</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile & Tablet Touch-Friendly Carousel (< 1024px) */}
      <div className="lg:hidden w-full">
        <div
          ref={mobileScrollRef}
          onScroll={handleMobileScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 sm:px-8 pb-4 scrollbar-none"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {ARENA_ITEMS.map((item) => (
            <div
              key={item.id}
              className="w-[85vw] max-w-[420px] shrink-0 snap-center bg-[#14161d] border border-neutral-800 rounded-none overflow-hidden flex flex-col shadow-xl"
            >
              {/* Photo */}
              <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover filter grayscale contrast-110"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/80 text-white font-mono font-bold text-[10px]">
                  {item.number} / 04
                </div>
              </div>

              {/* Info */}
              <div className="p-4 sm:p-5 flex flex-col justify-between flex-1">
                <div>
                  <span className="text-[10px] font-headline uppercase tracking-widest text-[#f36b22] font-bold block mb-1">
                    {item.subtitle}
                  </span>
                  <h3 className="text-base sm:text-lg font-headline font-black uppercase text-white leading-tight mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed font-editorial mb-4">
                    {item.description}
                  </p>

                  <div className="space-y-1 pt-2 border-t border-neutral-800">
                    {item.specs.slice(0, 3).map((spec, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-1.5 text-[11px] text-neutral-300">
                        <span className="w-1 h-1 rounded-full bg-[#f36b22]" />
                        <span className="truncate">{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {(onClaimPass || onExplorePlans) && (
                  <button
                    onClick={handleCtaClick}
                    className="mt-4 pt-3 border-t border-neutral-800 text-xs font-headline font-bold uppercase tracking-wider text-[#f36b22] inline-flex items-center gap-1.5"
                  >
                    <span>Claim Trial Pass</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Pagination Dots */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {ARENA_ITEMS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToMobileIndex(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                mobileActiveIndex === idx ? 'w-6 bg-[#f36b22]' : 'w-1.5 bg-neutral-700'
              }`}
              aria-label={`Jump to arena ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
