'use client';

export default function Logo({ size = 'large' }: { size?: 'large' | 'small' }) {
  const h = size === 'large' ? 44 : 28;
  const textSize = size === 'large' ? 'text-2xl' : 'text-lg';

  return (
    <div className="flex items-center justify-center gap-2">
      <svg width={h} height={h} viewBox="0 0 64 64" fill="none">
        {/* Popcorn kernels */}
        <circle cx="20" cy="18" r="9" fill="#FFF8E7" />
        <circle cx="32" cy="13" r="10" fill="#FFFFFF" />
        <circle cx="44" cy="18" r="9" fill="#FFF8E7" />
        <circle cx="26" cy="10" r="7" fill="#FFFFFF" />
        <circle cx="38" cy="10" r="7" fill="#FFF8E7" />
        <circle cx="32" cy="6" r="6" fill="#FFFFFF" />
        {/* Bucket */}
        <polygon points="14,24 18,56 46,56 50,24" fill="#E8A317" />
        <rect x="12" y="22" width="40" height="6" rx="2" fill="#D4920F" />
        {/* Bucket stripes */}
        <line x1="19" y1="34" x2="45" y2="34" stroke="#1C1410" strokeWidth="1.5" strokeOpacity="0.2" />
        <line x1="20" y1="42" x2="44" y2="42" stroke="#1C1410" strokeWidth="1.5" strokeOpacity="0.2" />
        <line x1="21" y1="50" x2="43" y2="50" stroke="#1C1410" strokeWidth="1.5" strokeOpacity="0.2" />
      </svg>
      <span className={`${textSize} font-extrabold tracking-tight text-warm-gold`}>
        Captain Popcorn
      </span>
    </div>
  );
}
