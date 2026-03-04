import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
    // Search TMDB for people (actors, directors)
    const searchRes = await fetch(
      `${TMDB_BASE}/search/person?api_key=${apiKey}&query=${encodeURIComponent(q)}&page=1`
    );
    const searchData = await searchRes.json();
    const people = (searchData.results || []).slice(0, 5);

    if (people.length === 0) {
      return NextResponse.json({ people: [], matching_tmdb_ids: [] });
    }

    // Get combined credits for each person
    const allTmdbIds: Set<number> = new Set();
    const peopleResults: any[] = [];

    for (const person of people) {
      const creditsRes = await fetch(
        `${TMDB_BASE}/person/${person.id}/combined_credits?api_key=${apiKey}`
      );
      const credits = await creditsRes.json();

      const castIds = (credits.cast || []).map((c: any) => c.id);
      const crewIds = (credits.crew || [])
        .filter((c: any) => c.job === 'Director' || c.department === 'Directing')
        .map((c: any) => c.id);

      const allIds = [...new Set([...castIds, ...crewIds])];
      allIds.forEach((id: number) => allTmdbIds.add(id));

      peopleResults.push({
        id: person.id,
        name: person.name,
        known_for: person.known_for_department || 'Acting',
        profile_url: person.profile_path
          ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
          : null,
        credit_count: allIds.length,
      });
    }

    // Cross-reference with our crew's recommendations
    const { data: recs } = await supabase
      .from('recommendations')
      .select('tmdb_id')
      .not('tmdb_id', 'is', null);

    const ourTmdbIds = new Set((recs || []).map((r: any) => r.tmdb_id));
    const matchingIds = [...allTmdbIds].filter((id) => ourTmdbIds.has(id));

    return NextResponse.json({
      people: peopleResults,
      matching_tmdb_ids: matchingIds,
    });
  } catch (err) {
    console.error('Person search error:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
