import React from 'react';
import heroPanoramaImg from '../assets/images/antique_hero_panorama_bg_1792239521892.jpg';

interface AntiqueHeroProps {
  onReadMore?: () => void;
  onExplorePlans?: () => void;
}

export const AntiqueHero: React.FC<AntiqueHeroProps> = () => {
  return (
    <section
      id="hero"
      className="relative bg-[#e6e8eb] pt-[72px] sm:pt-[84px] lg:pt-[90px] w-full overflow-hidden flex flex-col justify-center select-none"
    >
      {/* Shared Responsive Stage — Maintains the exact 1376:768 image composition across all screen sizes */}
      <div className="relative w-full max-w-[1440px] mx-auto overflow-hidden">
        <div className="relative w-full aspect-[1376/768] select-none">
          {/* Athlete Photograph — 100% full uncropped image showing athlete head, full torso, legs, and outstretched arm */}
          <img
            src={heroPanoramaImg || "/images/antique_hero_panorama_bg_1792239521892.jpg"}
            alt="Prime Fitness Hero Athlete Background"
            className="w-full h-full object-contain block filter brightness-100 contrast-105 pointer-events-none select-none"
            referrerPolicy="no-referrer"
          />

          {/* Master Heading Composition — BUILD / YOUR / BODY on three separate lines, scaling proportionally */}
          <div className="absolute left-[52%] top-[18%] w-[46%] pointer-events-none select-none z-10 text-left">
            <h1 className="font-headline font-black text-[clamp(1.15rem,5.6vw,5.5rem)] tracking-tight uppercase leading-[0.88] select-none">
              <span className="text-[#f36b22] block whitespace-nowrap">BUILD</span>
              <span className="text-neutral-900 block whitespace-nowrap">YOUR</span>
              <span className="text-neutral-900 block whitespace-nowrap">BODY</span>
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
};

