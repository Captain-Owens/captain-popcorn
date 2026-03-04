import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TMDB_GENRES } from '@/lib/constants';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

// Quality floor
const MIN_RATING = 7.0;
const MIN_VOTES = 500;
const MAX_RESULTS = 8;

// How many seed titles to sample (to avoid too many API calls)
const MAX_SEEDS = 25;

interface TMDBRec {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  overview: string;
  media_type?: string;
}

interface ScoredRec {
  id: number;
  title: string;
  poster_url: string | null;
  year: number | null;
  genre: string | null;
  tmdb_rating: number | null;
  type: 'movie' | 'show';
  overview: string | null;
  vote_count: number;
  overlap: number; // how many seed titles recommend this
  score: number;   // final ranking score
}

async function fetchTMDBRecs(tmdbId: number, type: 'movie' | 'show'): Promise<TMDBRec[]> {
  try {
    const endpoint = type === 'movie'
      ? `${TMDB_BASE}/movie/${tmdbId}/recommendations`
      : `${TMDB_BASE}/tv/${tmdbId}/recommendations`;

    const res = await fetch(
      `${endpoint}?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
      { next: { revalidate: 3600 } } // cache for 1 hour
    );

    if (!res.ok) return [];

    const data = await res.json();
    return (data.results || []).map((r: any) => ({
      ...r,
      media_type: type === 'movie' ? 'movie' : 'tv',
    }));
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    // 1. Get all crew recommendations that have TMDB IDs
    const { data: recs } = await supabase
      .from('recommendations')
      .select('tmdb_id, type, title')
      .not('tmdb_id', 'is', null);

    if (!recs || recs.length < 3) {
      return NextResponse.json([]);
    }

    // Set of existing TMDB IDs to exclude
    const existingIds = new Set(recs.map((r) => r.tmdb_id));

    // 2. Sample seed titles (shuffle and take up to MAX_SEEDS)
    const shuffled = [...recs].sort(() => Math.random() - 0.5);
    const seeds = shuffled.slice(0, MAX_SEEDS);

    // 3. Fetch recommendations for each seed title in parallel
    const allPromises = seeds.map((seed) =>
      fetchTMDBRecs(seed.tmdb_id!, seed.type as 'movie' | 'show')
    );
    const allResults = await Promise.all(allPromises);

    // 4. Pool and score all recommendations
    const recMap = new Map<number, ScoredRec>();

    for (const results of allResults) {
      for (const r of results) {
        // Skip if already in crew's catalog
        if (existingIds.has(r.id)) continue;

        // Skip if below quality floor
        if (r.vote_average < MIN_RATING) continue;
        if (r.vote_count < MIN_VOTES) continue;

        const isMovie = r.media_type === 'movie' || !!r.title;
        const title = isMovie ? (r.title || '') : (r.name || '');
        const dateStr = isMovie ? r.release_date : r.first_air_date;
        const year = dateStr ? parseInt(dateStr.slice(0, 4)) : null;

        if (recMap.has(r.id)) {
          // Already seen - increment overlap count
          const existing = recMap.get(r.id)!;
          existing.overlap += 1;
          existing.score = existing.overlap * 3 + (existing.tmdb_rating || 0);
        } else {
          // New recommendation
          const genre = r.genre_ids
            ?.map((gid: number) => TMDB_GENRES[gid])
            .filter(Boolean)
            .join(', ') || null;

          recMap.set(r.id, {
            id: r.id,
            title,
            poster_url: r.poster_path
              ? `https://image.tmdb.org/t/p/w342${r.poster_path}`
              : null,
            year,
            genre,
            tmdb_rating: r.vote_average
              ? Math.round(r.vote_average * 10) / 10
              : null,
            type: isMovie ? 'movie' : 'show',
            overview: r.overview || null,
            vote_count: r.vote_count,
            overlap: 1,
            score: 3 + (r.vote_average || 0), // base overlap of 1 * 3 + rating
          });
        }
      }
    }

    // 5. Sort by score (overlap count * 3 + TMDB rating) and take top results
    const sorted = Array.from(recMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS);

    // 6. Return clean response (strip internal scoring fields)
    const response = sorted.map(({ id, title, poster_url, year, genre, tmdb_rating, type, overview }) => ({
      id,
      title,
      poster_url,
      year,
      genre,
      tmdb_rating,
      type,
      overview,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Discover error:', error);
    return NextResponse.json([]);
  }
}
