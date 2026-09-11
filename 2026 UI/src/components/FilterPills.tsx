import { Check } from 'lucide-react';
import type { DeviceCategory } from '../data/devices';

type FilterId = 'All' | DeviceCategory;

interface Props {
  selected: FilterId[];
  onChange: (next: FilterId[]) => void;
}

const CATEGORIES: FilterId[] = ['Lights', 'Appliances', 'Media', 'Sensors'];
const FILTERS: FilterId[] = ['All', ...CATEGORIES];

export default function FilterPills({ selected, onChange }: Props) {
  const allCategoriesSelected = CATEGORIES.every(c => selected.includes(c));

  const toggle = (id: FilterId) => {
    if (id === 'All') { onChange(['All']); return; }
    const withoutAll = selected.filter(s => s !== 'All');
    const next = withoutAll.includes(id)
      ? withoutAll.filter(s => s !== id)
      : [...withoutAll, id];
    onChange(next.length === 0 ? ['All'] : next);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {FILTERS.map(id => {
        // "All" reads as active when every category is selected, too
        const active = id === 'All'
          ? (selected.includes('All') || allCategoriesSelected)
          : selected.includes(id);
        return (
          <button
            key={id}
            onClick={() => toggle(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              border: active ? '1px solid var(--c-amber-brd)' : '1px solid #E7E1D5',
              background: active ? 'var(--c-amber-light)' : 'var(--c-card)',
              color: active ? '#9A6A1E' : 'var(--c-muted)',
              transition: 'all .15s',
            }}
          >
            {active && <Check size={11} strokeWidth={3} />}
            {id}
          </button>
        );
      })}
    </div>
  );
}

export type { FilterId };
