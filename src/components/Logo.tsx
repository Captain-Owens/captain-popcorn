'use client';

export default function Logo({ size = 'large' }: { size?: 'large' | 'small' }) {
  const h = size === 'large' ? 48 : 32;
  const textSize = size === 'large' ? 'text-2xl' : 'text-lg';

  return (
    <div className="flex items-center justify-center gap-1">
      {/* Film reel C */}
      <svg width={h} height={h} viewBox="0 0 64 64" fill="none">
        {/* Film strip curved into a C shape */}
        <path
          d="M52 16C52 16 56 22 56 32C56 42 52 48 52 48"
          stroke="#E8A317"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.3"
        />
        {/* Main C shape - film strip */}
        <path
          d="M48 12 C 36 4, 16 8, 12 20 C 8 32, 10 44, 20 52 C 28 58, 40 58, 48 52"
          stroke="#E8A317"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
        {/* Sprocket holes along the outer edge */}
        <rect x="42" y="9" width="5" height="3.5" rx="1" fill="#1C1410" />
        <rect x="30" y="4" width="5" height="3.5" rx="1" fill="#1C1410" />
        <rect x="18" y="7" width="5" height="3.5" rx="1" fill="#1C1410" />
        <rect x="10" y="15" width="5" height="3.5" rx="1" fill="#1C1410" />
        <rect x="6" y="26" width="5" height="3.5" rx="1" fill="#1C1410" />
        <rect x="7" y="37" width="5" height="3.5" rx="1" fill="#1C1410" />
        <rect x="12" y="46" width="5" height="3.5" rx="1" fill="#1C1410" />
        <rect x="21" y="53" width="5" height="3.5" rx="1" fill="#1C1410" />
        <rect x="32" y="55" width="5" height="3.5" rx="1" fill="#1C1410" />
        <rect x="42" y="51" width="5" height="3.5" rx="1" fill="#1C1410" />
        {/* Inner sprocket holes */}
        <rect x="38" y="15" width="4" height="3" rx="1" fill="#1C1410" />
        <rect x="28" y="10" width="4" height="3" rx="1" fill="#1C1410" />
        <rect x="19" y="14" width="4" height="3" rx="1" fill="#1C1410" />
        <rect x="14" y="22" width="4" height="3" rx="1" fill="#1C1410" />
        <rect x="12" y="32" width="4" height="3" rx="1" fill="#1C1410" />
        <rect x="14" y="41" width="4" height="3" rx="1" fill="#1C1410" />
        <rect x="20" y="48" width="4" height="3" rx="1" fill="#1C1410" />
        <rect x="29" y="52" width="4" height="3" rx="1" fill="#1C1410" />
        <rect x="39" y="50" width="4" height="3" rx="1" fill="#1C1410" />
      </svg>
      <span className={`${textSize} font-extrabold tracking-tight`} style={{ color: '#E8A317' }}>
        aptain Popcorn
      </span>
    </div>
  );
}
