import React, { useRef } from 'react';
import heroPanoramaImg from '../assets/images/antique_hero_panorama_bg_1792239521892.jpg';
import { useGsapAnimation } from '../hooks/useGsapAnimation';
import { gsap } from '../utils/gsapSetup';

interface AntiqueHeroProps {
  onReadMore?: () => void;
  onExplorePlans?: () => void;
}

export const AntiqueHero: React.FC<AntiqueHeroProps> = () => {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const headingContainerRef = useRef<HTMLDivElement | null>(null);

  const containerRef = useGsapAnimation<HTMLElement>((_ctx) => {
    // 1. Hero Entrance Timeline on initial load
    const entranceTl = gsap.timeline({
      defaults: { ease: 'power4.out' },
    });

    // Image reveal: gentle scale down and opacity fade
    if (imageRef.current) {
      entranceTl.fromTo(
        imageRef.current,
        { scale: 1.05, opacity: 0.2 },
        { scale: 1, opacity: 1, duration: 1.3, ease: 'power2.out' },
        0
      );
    }

    // Line-by-line text reveal from masked overflow container
    entranceTl.fromTo(
      '.hero-line-inner',
      { yPercent: 120, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 1.1,
        stagger: 0.14,
        ease: 'power4.out',
      },
      0.15
    );

    // 2. Multi-plane Scroll Parallax
    if (imageRef.current && headingContainerRef.current) {
      // Parallax on image (moves slightly slower than scroll)
      gsap.to(imageRef.current, {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
        },
      });

      // Parallax on headline (floats with subtle upward momentum)
      gsap.to(headingContainerRef.current, {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
        },
      });
    }
  });

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative bg-[#e6e8eb] pt-[72px] sm:pt-[84px] lg:pt-[90px] w-full overflow-hidden flex flex-col justify-center select-none"
    >
      {/* Shared Responsive Stage — Maintains the exact 1376:768 image composition across all screen sizes */}
      <div className="relative w-full max-w-[1440px] mx-auto overflow-hidden">
        <div className="relative w-full aspect-[1376/768] select-none">
          {/* Athlete Photograph — 100% full uncropped image showing athlete head, full torso, legs, and outstretched arm */}
          <img
            ref={imageRef}
            src={heroPanoramaImg || '/images/antique_hero_panorama_bg_1792239521892.jpg'}
            alt="Prime Fitness Hero Athlete Background"
            className="w-full h-full object-contain block filter brightness-100 contrast-105 pointer-events-none select-none will-change-transform"
            referrerPolicy="no-referrer"
          />

          {/* Master Heading Composition — BUILD / YOUR / BODY with coordinated line-by-line mask entrance */}
          <div
            ref={headingContainerRef}
            className="absolute left-[52%] top-[18%] w-[46%] pointer-events-none select-none z-10 text-left will-change-transform"
          >
            <h1 className="font-headline font-black text-[clamp(1.15rem,5.6vw,5.5rem)] tracking-tight uppercase leading-[0.88] select-none">
              <span className="block overflow-hidden">
                <span className="hero-line-inner text-[#f36b22] block whitespace-nowrap">
                  BUILD
                </span>
              </span>
              <span className="block overflow-hidden">
                <span className="hero-line-inner text-neutral-900 block whitespace-nowrap">
                  YOUR
                </span>
              </span>
              <span className="block overflow-hidden">
                <span className="hero-line-inner text-neutral-900 block whitespace-nowrap">
                  BODY
                </span>
              </span>
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
};
