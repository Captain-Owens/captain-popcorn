import { NextRequest, NextResponse } from 'next/server';

const TMDB_BASE = 'https://api.themoviedb.org/3';

export async function GET(req: NextRequest) {
  const tmdbId = req.nextUrl.searchParams.get('tmdb_id');
  const type = req.nextUrl.searchParams.get('type') || 'movie';

  if (!tmdbId) {
    return NextResponse.json({ error: 'tmdb_id required' }, { status: 400 });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'TMDB_API_KEY not set' }, { status: 500 });
  }

  const mediaType = type === 'show' ? 'tv' : 'movie';

  try {
    const res = await fetch(
      `${TMDB_BASE}/${mediaType}/${tmdbId}/credits?api_key=${apiKey}`
    );
    const data = await res.json();

    // Top 5 cast
    const cast = (data.cast || [])
      .slice(0, 5)
      .map((c: any) => c.name);

    // Director(s)
    const directors = (data.crew || [])
      .filter((c: any) => c.job === 'Director')
      .slice(0, 2)
      .map((c: any) => c.name);

    // For TV shows, also check "created by" if no director
    let creators: string[] = [];
    if (mediaType === 'tv' && directors.length === 0) {
      const showRes = await fetch(
        `${TMDB_BASE}/tv/${tmdbId}?api_key=${apiKey}`
      );
      const showData = await showRes.json();
      creators = (showData.created_by || [])
        .slice(0, 2)
        .map((c: any) => c.name);
    }

    return NextResponse.json({
      cast,
      directors: directors.length > 0 ? directors : creators,
    });
  } catch {
    return NextResponse.json({ cast: [], directors: [] });
  }
}
