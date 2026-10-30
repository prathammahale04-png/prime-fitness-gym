import React, { useRef } from 'react';
import { PRIME_GYM_DATA } from '../data/primeGymData';
import athleticWomanImg from '../assets/images/athletic_woman_workout_1792235872529.jpg';
import athleticWomanWebp from '../assets/images/athletic_woman_workout_1792235872529.webp';
import { useGsapAnimation } from '../hooks/useGsapAnimation';
import { gsap } from '../utils/gsapSetup';

interface AntiqueArtOfBodyProps {
  onLearnMore: () => void;
}

export const AntiqueArtOfBody: React.FC<AntiqueArtOfBodyProps> = ({ onLearnMore }) => {
  const imageWrapperRef = useRef<HTMLDivElement | null>(null);
  const cardFrameRef = useRef<HTMLDivElement | null>(null);

  const sectionRef = useGsapAnimation<HTMLElement>((_ctx) => {
    // 1. Line-by-line masked title reveal on scroll entry
    gsap.fromTo(
      '.art-title-line',
      { yPercent: 110, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 1.0,
        stagger: 0.15,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: '#about',
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      }
    );

    // 2. Signature orange border frame expansion and content fade
    if (cardFrameRef.current) {
      gsap.fromTo(
        cardFrameRef.current,
        { opacity: 0, y: 35, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: cardFrameRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );
    }

    // 3. Editorial image clipping mask reveal
    if (imageWrapperRef.current) {
      gsap.fromTo(
        imageWrapperRef.current,
        { clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)', scale: 1.06 },
        {
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
          scale: 1,
          duration: 1.4,
          ease: 'power4.inOut',
          scrollTrigger: {
            trigger: imageWrapperRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Subtle scroll parallax on image
      gsap.to(imageWrapperRef.current, {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: {
          trigger: '#about',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6,
        },
      });
    }

    // 4. Subtle rotation and dot indicator pulse on the vertical rail
    gsap.fromTo(
      '.art-rail-dot',
      { scale: 0, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        stagger: 0.1,
        duration: 0.6,
        ease: 'back.out(2)',
        scrollTrigger: {
          trigger: '#about',
          start: 'top 70%',
          toggleActions: 'play none none none',
        },
      }
    );
  });

  return (
    <section id="about" ref={sectionRef} className="py-16 sm:py-20 lg:py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Bold Headline & Signature Orange Wireframe Box */}
          <div className="lg:col-span-6 relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-black text-neutral-900 tracking-tight leading-[1.08] uppercase mb-6 sm:mb-8">
              <span className="block overflow-hidden">
                <span className="art-title-line block">YOUR BODY IS</span>
              </span>
              <span className="block overflow-hidden">
                <span className="art-title-line block text-[#f36b22]">A WORK OF ART</span>
              </span>
            </h2>

            {/* Signature Orange Rectangular Border Frame */}
            <div
              ref={cardFrameRef}
              className="border-2 border-[#f36b22] p-5 sm:p-8 lg:p-10 relative bg-white/70 backdrop-blur-xs max-w-lg shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <p className="text-neutral-700 text-xs sm:text-sm leading-relaxed mb-6">
                Small but regular workout effort leads you to beauty and self-confidence. Set your own routine and conditions of training, choose the program that boosts your results. Take the chance to get proud of yourself. Let your body feel the way of perfection.
              </p>

              {/* Gym Discipline Chips */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-200/80 mb-6 text-xs text-neutral-800">
                <div className="group/stat">
                  <span className="font-headline font-bold block text-[11px] uppercase tracking-wider text-[#f36b22] group-hover/stat:text-[#d95614] transition-colors">
                    FACILITY
                  </span>
                  <span className="font-semibold text-neutral-900">{PRIME_GYM_DATA.facilitySize}</span>
                </div>
                <div className="group/stat">
                  <span className="font-headline font-bold block text-[11px] uppercase tracking-wider text-[#f36b22] group-hover/stat:text-[#d95614] transition-colors">
                    TIMINGS
                  </span>
                  <span className="font-semibold text-neutral-900">{PRIME_GYM_DATA.timings}</span>
                </div>
                <div className="col-span-2 pt-1 group/stat">
                  <span className="font-headline font-bold block text-[11px] uppercase tracking-wider text-[#f36b22] group-hover/stat:text-[#d95614] transition-colors">
                    PROGRAMS
                  </span>
                  <span className="font-semibold text-neutral-900">{PRIME_GYM_DATA.disciplines}</span>
                </div>
              </div>

              {/* Micro-interaction Button with Animated Slide Underline */}
              <button
                onClick={onLearnMore}
                className="group relative inline-flex items-center gap-1.5 text-xs font-headline font-bold uppercase tracking-[0.2em] text-[#f36b22] hover:text-[#d95614] pb-1 transition-colors cursor-pointer"
              >
                <span>READ MORE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#f36b22] group-hover:translate-x-1 transition-transform duration-200" />
                <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#f36b22] origin-left scale-x-100 group-hover:scale-x-110 transition-transform duration-200" />
              </button>
            </div>
          </div>

          {/* Right Column: Woman Planking on Clean White Floor with Editorial Mask */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div
              ref={imageWrapperRef}
              className="relative max-w-lg w-full overflow-hidden will-change-transform"
            >
              <picture className="w-full h-auto block">
                <source srcSet={athleticWomanWebp} type="image/webp" />
                <img
                  src={athleticWomanImg}
                  alt="Athletic Fitness Training at Prime Fitness"
                  width={512}
                  height={500}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto object-contain max-h-[500px] select-none pointer-events-none"
                  referrerPolicy="no-referrer"
                />
              </picture>
            </div>
          </div>

          {/* Far Right: Vertical Rail Indicator from Reference Image */}
          <div className="hidden xl:flex lg:col-span-1 flex-col items-center justify-center gap-4 text-xs font-headline tracking-widest text-neutral-400 select-none">
            <div className="flex flex-col items-center gap-3">
              <span className="art-rail-dot w-1.5 h-1.5 rounded-full bg-neutral-300" />
              <div className="flex items-center gap-1.5 -rotate-90 origin-center whitespace-nowrap my-6 text-[10px] font-bold tracking-[0.2em] text-neutral-700">
                <span>ABOUT</span>
                <span className="w-2 h-2 rounded-full bg-[#f36b22] animate-pulse" />
              </div>
              <span className="art-rail-dot w-1.5 h-1.5 rounded-full bg-neutral-300" />
              <span className="art-rail-dot w-1.5 h-1.5 rounded-full bg-neutral-300" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
