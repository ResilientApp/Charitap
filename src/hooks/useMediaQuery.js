import { useState, useEffect } from 'react';

/**
 * useMediaQuery
 *
 * Returns a live boolean indicating whether a CSS media query currently matches.
 * Re-evaluates whenever the window resizes. Uses window.matchMedia under the hood.
 *
 * @param {string} query - A valid CSS media query string
 * @returns {boolean} True if the query currently matches
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 767px)');
 */
const useMediaQuery = (query) => {
  const getMatches = (q) => {
    // SSR guard: window may not exist in server environments
    if (typeof window === 'undefined') return false;
    return window.matchMedia(q).matches;
  };

  const [matches, setMatches] = useState(getMatches(query));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQueryList.matches);

    // Handler to update state when the query result changes
    const handleChange = (event) => {
      setMatches(event.matches);
    };

    // Use the modern addEventListener if available, otherwise fall back to addListener
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers (Safari < 14)
      mediaQueryList.addListener(handleChange);
    }

    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handleChange);
      } else {
        mediaQueryList.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
};

export default useMediaQuery;

// ─── Convenience breakpoint hooks ──────────────────────────────────────────────

/**
 * useIsMobile — matches screens up to 767px (< md in Tailwind)
 */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');

/**
 * useIsTablet — matches screens up to 1023px (< lg in Tailwind)
 */
export const useIsTablet = () => useMediaQuery('(max-width: 1023px)');

/**
 * useIsDesktop — matches screens 1024px and wider (>= lg in Tailwind)
 */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
