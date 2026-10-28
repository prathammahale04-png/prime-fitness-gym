import React from 'react';
import { PRIME_GYM_DATA } from '../data/primeGymData';
import { useGsapAnimation } from '../hooks/useGsapAnimation';
import { gsap } from '../utils/gsapSetup';

interface AntiqueFooterProps {
  onNavigate: (id: string) => void;
  onOpenStaffPortal?: () => void;
}

export const AntiqueFooter: React.FC<AntiqueFooterProps> = ({ onNavigate, onOpenStaffPortal }) => {
  const footerRef = useGsapAnimation<HTMLElement>((_ctx) => {

    gsap.from('.footer-content-wrap', {
      scrollTrigger: {
        trigger: footerRef.current,
        start: 'top 95%',
        toggleActions: 'play none none none',
      },
      opacity: 0,
      y: 20,
      duration: 0.8,
      ease: 'power2.out',
    });
  });

  return (
    <footer ref={footerRef} className="bg-white border-t border-neutral-100 py-12 text-xs text-neutral-500 relative">
      <div className="footer-content-wrap max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 flex items-center justify-center text-[#f36b22] shrink-0">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M12 2C8.5 2 6 5 6 8.5c0 2.2.8 4.2 2.2 5.7-.3 1.3-.8 2.8-1.7 4.3-.2.4 0 .9.4 1.1.4.2.9 0 1.1-.4 1.2-2 1.9-3.9 2.2-5.4.6.1 1.2.2 1.8.2s1.2-.1 1.8-.2c.3 1.5 1 3.4 2.2 5.4.2.4.7.6 1.1.4.4-.2.6-.7.4-1.1-.9-1.5-1.4-3-1.7-4.3 1.4-1.5 2.2-3.5 2.2-5.7C20 5 17.5 2 12 2zm0 3.5c1.4 0 2.5 1.1 2.5 2.5S13.4 10.5 12 10.5 9.5 9.4 9.5 8 10.6 5.5 12 5.5z" />
            </svg>
          </div>
          <span className="font-headline font-black text-sm tracking-widest uppercase text-neutral-900">
            {PRIME_GYM_DATA.brandName} · {PRIME_GYM_DATA.city}
          </span>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 font-headline font-bold uppercase tracking-[0.15em] text-[11px] text-neutral-600">
          <button
            onClick={() => onNavigate('hero')}
            className="hover:text-[#f36b22] transition-colors cursor-pointer"
          >
            TOP
          </button>
          <button
            onClick={() => onNavigate('about')}
            className="hover:text-[#f36b22] transition-colors cursor-pointer"
          >
            ABOUT
          </button>
          <button
            onClick={() => onNavigate('facility')}
            className="hover:text-[#f36b22] transition-colors cursor-pointer"
          >
            FACILITY
          </button>
          <button
            onClick={() => onNavigate('trainers')}
            className="hover:text-[#f36b22] transition-colors cursor-pointer"
          >
            TRAINERS
          </button>
          <button
            onClick={() => onNavigate('prices')}
            className="hover:text-[#f36b22] transition-colors cursor-pointer"
          >
            PRICES
          </button>
          <button
            onClick={() => onNavigate('contacts')}
            className="hover:text-[#f36b22] transition-colors cursor-pointer"
          >
            CONTACTS
          </button>
          {onOpenStaffPortal && (
            <button
              onClick={onOpenStaffPortal}
              className="text-neutral-400 hover:text-[#f36b22] transition-colors cursor-pointer border-l border-neutral-200 pl-4"
            >
              STAFF PORTAL
            </button>
          )}
        </div>

        <p className="text-[11px] text-neutral-400">
          © {new Date().getFullYear()} {PRIME_GYM_DATA.brandName} Jalgaon. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
