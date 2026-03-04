import { NextRequest, NextResponse } from 'next/server';
import { TMDBParsed } from '@/lib/types';
import { TMDB_GENRES, TMDB_POSTER_MD } from '@/lib/constants';

const TMDB_BASE = 'https://api.themoviedb.org/3';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'TMDB_API_KEY not set' }, { status: 500 });
  }
  try {
    const url = `${TMDB_BASE}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(q)}&page=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB search failed: ${res.status}`);
    const data = await res.json();
    const results = (data.results || [])
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .slice(0, 8)
      .map((item: any): TMDBParsed => {
        const isMovie = item.media_type === 'movie';
        const title = isMovie ? item.title : item.name;
        const releaseDate = isMovie ? item.release_date : item.first_air_date;
        return {
          tmdb_id: item.id,
          title: title || 'Unknown',
          poster_url: item.poster_path ? `${TMDB_POSTER_MD}${item.poster_path}` : null,
          year: releaseDate ? parseInt(releaseDate.split('-')[0], 10) : null,
          genre: item.genre_ids?.slice(0, 2).map((id: number) => TMDB_GENRES[id]).filter(Boolean).join(', ') || null,
          tmdb_rating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : null,
          type: isMovie ? 'movie' : 'show',
        };
      });
    return NextResponse.json(results);
  } catch (err) {
    console.error('TMDB search error:', err);
    return NextResponse.json({ error: 'Search failed. Try again.' }, { status: 500 });
  }
}
