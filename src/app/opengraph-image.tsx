import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Captain Popcorn';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1C1410',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Popcorn bucket using shapes */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
          {/* Popcorn kernels */}
          <div style={{ display: 'flex', gap: -4, marginBottom: -15 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#FFF8E7' }} />
            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#FFFFFF', marginTop: -8 }} />
            <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#FFF8E7', marginTop: -4 }} />
            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#FFFFFF', marginTop: -10 }} />
            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#FFF8E7' }} />
          </div>
          {/* Bucket */}
          <svg width="160" height="140" viewBox="0 0 160 140">
            <polygon points="20,0 140,0 125,130 35,130" fill="#E50914" />
            <rect x="15" y="0" width="130" height="16" rx="4" fill="#C41017" />
            <line x1="30" y1="35" x2="130" y2="35" stroke="#FFFFFF" strokeWidth="3" strokeOpacity="0.25" />
            <line x1="33" y1="60" x2="127" y2="60" stroke="#FFFFFF" strokeWidth="3" strokeOpacity="0.25" />
            <line x1="36" y1="85" x2="124" y2="85" stroke="#FFFFFF" strokeWidth="3" strokeOpacity="0.25" />
            <line x1="38" y1="110" x2="122" y2="110" stroke="#FFFFFF" strokeWidth="3" strokeOpacity="0.25" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: '#E8A317',
            marginBottom: 12,
          }}
        >
          Captain Popcorn
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 32,
            color: '#FFFFFF',
            opacity: 0.6,
          }}
        >
          What should we watch tonight?
        </div>
      </div>
    ),
    { ...size }
  );
}
