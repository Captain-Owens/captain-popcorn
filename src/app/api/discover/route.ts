import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TMDB_GENRES } from '@/lib/constants';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

export async function GET() {
  try {
    // Get all recommendations to analyze group taste
    const { data: recs } = await supabase
      .from('recommendations')
      .select('*')
      .not('tmdb_id', 'is', null);

    if (!recs || recs.length < 5) {
      return NextResponse.json([]);
    }

    // Analyze genres
    const genreCounts: Record<string, number> = {};
    let movieCount = 0;
    let showCount = 0;

    recs.forEach((rec) => {
      if (rec.type === 'movie') movieCount++;
      else showCount++;
      if (rec.genre) {
        rec.genre.split(', ').forEach((g: string) => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      }
    });

    // Top 3 genres
    const topGenres = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([g]) => g);

    // Map genre names to TMDB IDs
    const genreNameToId: Record<string, number> = {};
    Object.entries(TMDB_GENRES).forEach(([id, name]) => {
      genreNameToId[name] = parseInt(id);
    });

    const genreIds = topGenres
      .map((g) => genreNameToId[g])
      .filter(Boolean);

    // Existing TMDB IDs to exclude
    const existingIds = new Set(recs.map((r) => r.tmdb_id));

    const results: any[] = [];

    // Fetch movie suggestions
    if (genreIds.length > 0) {
      const movieUrl = `${TMDB_BASE}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreIds.join(',')}&sort_by=vote_average.desc&vote_count.gte=50&language=en-US&page=1`;
      const movieRes = await fetch(movieUrl);
      const movieData = await movieRes.json();

      if (movieData.results) {
        movieData.results.forEach((m: any) => {
          if (!existingIds.has(m.id)) {
            results.push({
              id: m.id,
              title: m.title,
              poster_url: m.poster_path
                ? `https://image.tmdb.org/t/p/w342${m.poster_path}`
                : null,
              year: m.release_date ? parseInt(m.release_date.slice(0, 4)) : null,
              genre: m.genre_ids?.map((gid: number) => TMDB_GENRES[gid]).filter(Boolean).join(', ') || null,
              tmdb_rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null,
              type: 'movie',
              reason: `Based on your crew's love of ${topGenres.slice(0, 2).join(' and ')}`,
            });
          }
        });
      }

      // Fetch TV suggestions
      const tvUrl = `${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=${genreIds.join(',')}&sort_by=vote_average.desc&vote_count.gte=50&language=en-US&page=1`;
      const tvRes = await fetch(tvUrl);
      const tvData = await tvRes.json();

      if (tvData.results) {
        tvData.results.forEach((t: any) => {
          if (!existingIds.has(t.id)) {
            results.push({
              id: t.id,
              title: t.name,
              poster_url: t.poster_path
                ? `https://image.tmdb.org/t/p/w342${t.poster_path}`
                : null,
              year: t.first_air_date ? parseInt(t.first_air_date.slice(0, 4)) : null,
              genre: t.genre_ids?.map((gid: number) => TMDB_GENRES[gid]).filter(Boolean).join(', ') || null,
              tmdb_rating: t.vote_average ? Math.round(t.vote_average * 10) / 10 : null,
              type: 'show',
              reason: `Based on your crew's love of ${topGenres.slice(0, 2).join(' and ')}`,
            });
          }
        });
      }
    }

    // Shuffle and return top 8
    for (let i = results.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [results[i], results[j]] = [results[j], results[i]];
    }

    return NextResponse.json(results.slice(0, 8));
  } catch (error) {
    console.error('Discover error:', error);
    return NextResponse.json([]);
  }
}
