import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { PRIME_GYM_DATA } from '../data/primeGymData';

interface AntiqueHeaderProps {
  onNavigate: (id: string) => void;
  onOpenJoin: () => void;
}

export const AntiqueHeader: React.FC<AntiqueHeaderProps> = ({ onNavigate, onOpenJoin }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);

      // Scroll up/down hide behavior as requested by user
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        if (!mobileMenuOpen) {
          setIsVisible(false);
        }
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, mobileMenuOpen]);

  const handleLinkClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        } ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm py-4 border-b border-neutral-100'
            : 'bg-white py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between">
          {/* Logo Brand: Spartan Helmet icon in vibrant orange + Brand Name */}
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('hero');
            }}
            className="flex items-center gap-2 sm:gap-3 group shrink-0"
          >
            {/* Spartan Helmet Icon in Orange */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[#f36b22] shrink-0">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 sm:w-8 sm:h-8">
                <path d="M12 2C8.5 2 6 5 6 8.5c0 2.2.8 4.2 2.2 5.7-.3 1.3-.8 2.8-1.7 4.3-.2.4 0 .9.4 1.1.4.2.9 0 1.1-.4 1.2-2 1.9-3.9 2.2-5.4.6.1 1.2.2 1.8.2s1.2-.1 1.8-.2c.3 1.5 1 3.4 2.2 5.4.2.4.7.6 1.1.4.4-.2.6-.7.4-1.1-.9-1.5-1.4-3-1.7-4.3 1.4-1.5 2.2-3.5 2.2-5.7C20 5 17.5 2 12 2zm0 3.5c1.4 0 2.5 1.1 2.5 2.5S13.4 10.5 12 10.5 9.5 9.4 9.5 8 10.6 5.5 12 5.5z" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1 sm:gap-1.5">
              <span className="font-headline text-base sm:text-xl font-black tracking-[0.15em] sm:tracking-[0.25em] text-[#f36b22] uppercase">
                PRIME
              </span>
              <span className="font-headline text-base sm:text-xl font-black tracking-[0.15em] sm:tracking-[0.25em] text-neutral-900 uppercase">
                FITNESS
              </span>
            </div>
          </a>

          {/* Right Navigation: ABOUT · TRAINERS · PRICES · CONTACTS */}
          <nav className="hidden md:flex items-center gap-10">
            <button
              onClick={() => handleLinkClick('about')}
              className="text-xs font-headline font-bold uppercase tracking-[0.2em] text-neutral-800 hover:text-[#f36b22] transition-colors cursor-pointer"
            >
              ABOUT
            </button>
            <button
              onClick={() => handleLinkClick('trainers')}
              className="text-xs font-headline font-bold uppercase tracking-[0.2em] text-neutral-800 hover:text-[#f36b22] transition-colors cursor-pointer"
            >
              TRAINERS
            </button>
            <button
              onClick={() => handleLinkClick('prices')}
              className="text-xs font-headline font-bold uppercase tracking-[0.2em] text-neutral-800 hover:text-[#f36b22] transition-colors cursor-pointer"
            >
              PRICES
            </button>
            <button
              onClick={() => handleLinkClick('contacts')}
              className="text-xs font-headline font-bold uppercase tracking-[0.2em] text-neutral-800 hover:text-[#f36b22] transition-colors cursor-pointer"
            >
              CONTACTS
            </button>
          </nav>

          {/* Join Call to Action / Mobile Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenJoin}
              className="hidden sm:inline-block px-5 py-2 text-xs font-headline font-bold uppercase tracking-[0.18em] text-white bg-[#f36b22] hover:bg-[#d95614] rounded-none transition-colors cursor-pointer"
            >
              JOIN NOW
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-neutral-800 hover:text-[#f36b22]"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white md:hidden pt-24 px-8 flex flex-col justify-between pb-10">
          <nav className="flex flex-col gap-8 pt-6">
            <button
              onClick={() => handleLinkClick('about')}
              className="text-left text-sm font-headline font-bold uppercase tracking-[0.2em] text-neutral-900 hover:text-[#f36b22] py-2 border-b border-neutral-100"
            >
              ABOUT
            </button>
            <button
              onClick={() => handleLinkClick('trainers')}
              className="text-left text-sm font-headline font-bold uppercase tracking-[0.2em] text-neutral-900 hover:text-[#f36b22] py-2 border-b border-neutral-100"
            >
              TRAINERS
            </button>
            <button
              onClick={() => handleLinkClick('prices')}
              className="text-left text-sm font-headline font-bold uppercase tracking-[0.2em] text-neutral-900 hover:text-[#f36b22] py-2 border-b border-neutral-100"
            >
              PRICES
            </button>
            <button
              onClick={() => handleLinkClick('contacts')}
              className="text-left text-sm font-headline font-bold uppercase tracking-[0.2em] text-neutral-900 hover:text-[#f36b22] py-2 border-b border-neutral-100"
            >
              CONTACTS
            </button>
          </nav>

          <div className="pt-6">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenJoin();
              }}
              className="w-full py-4 text-xs font-headline font-bold uppercase tracking-[0.2em] text-white bg-[#f36b22] text-center"
            >
              CLAIM FREE TRIAL PASS
            </button>
            <p className="text-center text-xs text-neutral-500 mt-3 font-medium">
              Saawariya godown, Shivaji Nagar, Jalgaon
            </p>
          </div>
        </div>
      )}
    </>
  );
};
