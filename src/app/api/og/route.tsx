import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1C1410',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Popcorn emoji as hero */}
        <div style={{ fontSize: 180, marginBottom: 20 }}>🍿</div>

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
            color: '#FAF3E0',
            opacity: 0.7,
          }}
        >
          What should we watch tonight?
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
