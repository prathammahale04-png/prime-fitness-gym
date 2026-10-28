import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, isReducedMotionPreferred } from '../utils/gsapSetup';

interface UseGsapAnimationOptions {
  dependencies?: any[];
  disabledOnReducedMotion?: boolean;
}

/**
 * Custom React hook for safely running GSAP animations and ScrollTriggers
 * with scoped context and automatic teardown on unmount.
 */
export function useGsapAnimation<T extends HTMLElement = HTMLDivElement>(
  animationCallback: (ctx: gsap.Context) => void,
  options: UseGsapAnimationOptions = {}
) {
  const scopeRef = useRef<T | null>(null);
  const { dependencies = [], disabledOnReducedMotion = true } = options;

  useEffect(() => {
    // If reduced motion is requested and option is set, skip heavy scroll animations
    if (disabledOnReducedMotion && isReducedMotionPreferred()) {
      return;
    }

    if (!scopeRef.current) return;

    // Create GSAP context scoped to current component element
    const ctx = gsap.context((self) => {
      animationCallback(self);
    }, scopeRef.current);

    // Refresh ScrollTrigger once DOM layout calculations settle
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 120);

    return () => {
      clearTimeout(refreshTimer);
      // Clean up all tweens and triggers created in this context
      ctx.revert();
    };
  }, dependencies);

  return scopeRef;
}
