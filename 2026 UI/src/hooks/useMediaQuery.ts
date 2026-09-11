import { useState, useEffect } from 'react';

/**
 * Subscribe to a CSS media query and re-render when it changes.
 * Used to switch the desktop-first layout into its mobile/tablet variants.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

// Shared breakpoints (keep in sync with any CSS media queries).
export const MOBILE_QUERY = '(max-width: 768px)';
export const NARROW_QUERY = '(max-width: 480px)';

/** True on phones / narrow tablets where the layout stacks to a single column. */
export const useIsMobile = () => useMediaQuery(MOBILE_QUERY);
