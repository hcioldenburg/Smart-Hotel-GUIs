import { useEffect, useRef, useState } from 'react';

/**
 * Optimistic numeric value for live-controlled entities.
 * Shows local edits immediately, then follows the real Home Assistant value
 * once HA reports a change (so external changes still win).
 *
 * Returns [display, setLocal, isOverriding].
 */
export function useOptimistic(haValue: number) {
  const [override, setOverride] = useState<number | null>(null);
  const prev = useRef(haValue);

  useEffect(() => {
    if (prev.current !== haValue) {
      prev.current = haValue;
      setOverride(null); // HA confirmed / changed externally → drop the optimistic value
    }
  }, [haValue]);

  return [override ?? haValue, setOverride, override !== null] as const;
}
