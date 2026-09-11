import type { ReactNode } from 'react';
import { useEffect } from 'react';

/**
 * Mobile bottom-sheet used to host a detail panel (device / rule) over the
 * page instead of in a side column, which does not fit on a phone. Tapping the
 * dimmed backdrop closes it; the sheet itself scrolls.
 */
export default function DetailOverlay({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  // Lock body scroll while the sheet is open and close on Escape.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 150,
        background: 'rgba(24,22,18,.38)',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxHeight: '92vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </div>
    </div>
  );
}
