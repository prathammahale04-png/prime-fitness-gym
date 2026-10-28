import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, isReducedMotionPreferred } from '../utils/gsapSetup';

interface UseGsapAnimationOptions {
  dependencies?: any[];
  disabledOnReducedMotion?: boolean;
}

/**
 * Custom React hook for safely running GSAP animations and ScrollTriggers
 * with scoped context, dynamic reduced-motion listener, and automatic teardown on unmount.
 */
export function useGsapAnimation<T extends HTMLElement = HTMLDivElement>(
  animationCallback: (ctx: gsap.Context) => void,
  options: UseGsapAnimationOptions = {}
) {
  const scopeRef = useRef<T | null>(null);
  const { dependencies = [], disabledOnReducedMotion = true } = options;

  useEffect(() => {
    let ctx: gsap.Context | null = null;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const runAnimation = () => {
      // Revert existing context before re-initializing
      if (ctx) {
        ctx.revert();
        ctx = null;
      }

      if (disabledOnReducedMotion && isReducedMotionPreferred()) {
        return;
      }

      if (!scopeRef.current) return;

      // Create GSAP context scoped strictly to current component element
      ctx = gsap.context((self) => {
        animationCallback(self);
      }, scopeRef.current);

      // Refresh ScrollTrigger once DOM layout calculations settle
      refreshTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);

      // Extra refresh once fonts are settled to prevent miscalculated trigger offsets
      if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          ScrollTrigger.refresh();
        }).catch(() => {});
      }
    };

    runAnimation();

    // Listen for real-time changes to prefers-reduced-motion
    let mediaQuery: MediaQueryList | null = null;
    const handleMediaChange = () => {
      runAnimation();
    };

    if (typeof window !== 'undefined' && window.matchMedia) {
      mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      try {
        mediaQuery.addEventListener('change', handleMediaChange);
      } catch {
        // Fallback for older browser engines
        mediaQuery.addListener?.(handleMediaChange);
      }
    }

    return () => {
      if (mediaQuery) {
        try {
          mediaQuery.removeEventListener('change', handleMediaChange);
        } catch {
          mediaQuery.removeListener?.(handleMediaChange);
        }
      }
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      if (ctx) {
        ctx.revert();
      }
    };
  }, dependencies);

  return scopeRef;
}
