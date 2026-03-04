import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';

export async function GET(req: NextRequest) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'TMDB API key missing' }, { status: 500 });
  }

  // Get all recommendations to analyze group taste
  const { data: recs } = await supabase
    .from('recommendations')
    .select('title, type, genre, tmdb_id, tmdb_rating');

  if (!recs || recs.length < 5) {
    return NextResponse.json([]);
  }

  // Analyze group taste: count genres and types
  const genreCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = { movie: 0, show: 0 };
  const existingTmdbIds = new Set(recs.map(r => r.tmdb_id).filter(Boolean));

  for (const rec of recs) {
    typeCounts[rec.type] = (typeCounts[rec.type] || 0) + 1;
    if (rec.genre) {
      // Genre might be comma-separated
      const genres = rec.genre.split(',').map((g: string) => g.trim());
      for (const g of genres) {
        if (g) genreCounts[g] = (genreCounts[g] || 0) + 1;
      }
    }
  }

  // Get top 3 genres
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([g]) => g);

  // Map genre names back to TMDB genre IDs
  const genreIdMap: Record<string, number> = {
    'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35,
    'Crime': 80, 'Documentary': 99, 'Drama': 18, 'Family': 10751,
    'Fantasy': 14, 'History': 36, 'Horror': 27, 'Music': 10402,
    'Mystery': 9648, 'Romance': 10749, 'Sci-Fi': 878, 'Thriller': 53,
    'War': 10752, 'Western': 37,
  };

  const topGenreIds = topGenres
    .map(g => genreIdMap[g])
    .filter(Boolean);

  // Prefer the type the group watches more
  const preferType = typeCounts.movie >= typeCounts.show ? 'movie' : 'tv';

  // Fetch from TMDB discover endpoint
  const genreParam = topGenreIds.length > 0 ? `&with_genres=${topGenreIds.join(',')}` : '';
  const url = `${TMDB_BASE}/discover/${preferType}?api_key=${apiKey}&sort_by=vote_average.desc&vote_count.gte=200&vote_average.gte=7${genreParam}&page=1`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.results) {
      return NextResponse.json([]);
    }

    // Filter out anything already in the app
    const suggestions = data.results
      .filter((r: any) => !existingTmdbIds.has(r.id))
      .slice(0, 5)
      .map((r: any) => ({
        tmdb_id: r.id,
        title: r.title || r.name,
        poster_url: r.poster_path ? `${TMDB_IMG}${r.poster_path}` : null,
        year: (r.release_date || r.first_air_date || '').slice(0, 4) || null,
        tmdb_rating: r.vote_average ? Math.round(r.vote_average * 10) / 10 : null,
        type: preferType === 'movie' ? 'movie' : 'show',
        reason: topGenres.length > 0 ? `Based on your group's love of ${topGenres[0]}` : 'Highly rated',
      }));

    return NextResponse.json(suggestions);
  } catch {
    return NextResponse.json([]);
  }
}
