import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const TMDB_BASE = 'https://api.themoviedb.org/3';

export async function POST() {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'TMDB_API_KEY not set' }, { status: 500 });
  }

  // Get all recs that have a tmdb_id but no cast_crew data
  const { data: recs } = await supabase
    .from('recommendations')
    .select('id, tmdb_id, type')
    .not('tmdb_id', 'is', null)
    .or('cast_crew.is.null,cast_crew.eq.{}');

  if (!recs || recs.length === 0) {
    return NextResponse.json({ message: 'Nothing to backfill', count: 0 });
  }

  let updated = 0;

  for (const rec of recs) {
    const mediaType = rec.type === 'show' ? 'tv' : 'movie';

    try {
      const res = await fetch(
        `${TMDB_BASE}/${mediaType}/${rec.tmdb_id}/credits?api_key=${apiKey}`
      );
      const data = await res.json();

      const cast = (data.cast || [])
        .slice(0, 5)
        .map((c: any) => c.name);

      let directors = (data.crew || [])
        .filter((c: any) => c.job === 'Director')
        .slice(0, 2)
        .map((c: any) => c.name);

      // For TV, get creators if no director
      if (mediaType === 'tv' && directors.length === 0) {
        const showRes = await fetch(
          `${TMDB_BASE}/tv/${rec.tmdb_id}?api_key=${apiKey}`
        );
        const showData = await showRes.json();
        directors = (showData.created_by || [])
          .slice(0, 2)
          .map((c: any) => c.name);
      }

      const castCrew = { cast, directors };

      await supabase
        .from('recommendations')
        .update({ cast_crew: castCrew })
        .eq('id', rec.id);

      updated++;

      // Rate limit: wait 250ms between requests
      await new Promise((r) => setTimeout(r, 250));
    } catch {
      // Skip failed ones
    }
  }

  return NextResponse.json({ message: `Backfilled ${updated} titles`, count: updated });
}
