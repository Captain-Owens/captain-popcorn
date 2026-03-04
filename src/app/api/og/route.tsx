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
        <div style={{ fontSize: 200, marginBottom: 10 }}>🍿</div>
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
    {
      width: 1200,
      height: 630,
    }
  );
}
