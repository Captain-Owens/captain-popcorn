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
              backgroundColor: isActive ? '#E8A317' : '#2A2A2A',
              color: isActive ? '#1A1A1A' : '#8A8A7A',
              border: `2px solid ${isActive ? '#E8A317' : '#3A3A3A'}`,
            }}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
