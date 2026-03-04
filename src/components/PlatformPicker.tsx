'use client';

import { Platform } from '@/lib/types';
import { PLATFORMS } from '@/lib/constants';

interface PlatformPickerProps {
  selected: Platform | null;
  onSelect: (platform: Platform | null) => void;
}

const PLATFORM_LABELS: Record<Platform, string> = {
  netflix: 'Netflix',
  hbo: 'HBO',
  prime: 'Prime',
  disney: 'Disney+',
  hulu: 'Hulu',
  paramount: 'Paramount+',
  other: 'Other',
};

export default function PlatformPicker({ selected, onSelect }: PlatformPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PLATFORMS.map((p) => {
        const isActive = selected === p.slug;
        return (
          <button
            key={p.slug}
            type="button"
            onClick={() => onSelect(isActive ? null : p.slug)}
            className="px-4 py-2.5 rounded-btn text-sm font-bold btn-press transition-all min-h-[44px]"
            style={{
              backgroundColor: isActive ? p.color + '22' : '#2B2219',
              border: '2px solid ' + (isActive ? p.color : '#3D3228'),
              color: isActive ? p.color : '#D0C8C0',
            }}
          >
            {PLATFORM_LABELS[p.slug]}
          </button>
        );
      })}
    </div>
  );
}
