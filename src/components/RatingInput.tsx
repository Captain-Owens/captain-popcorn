'use client';

interface RatingInputProps {
  value: number | null;
  onChange: (rating: number | null) => void;
}

export default function RatingInput({ value, onChange }: RatingInputProps) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => {
        const isActive = value === n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(isActive ? null : n)}
            className="w-12 h-12 rounded-btn font-bold text-lg btn-press transition-all"
            style={{
              backgroundColor: isActive ? '#E8A317' : '#2B2219',
              color: isActive ? '#1C1410' : '#D0C8C0',
              border: `2px solid ${isActive ? '#E8A317' : '#4A3D32'}`,
            }}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
