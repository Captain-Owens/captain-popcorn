import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const memberId = params.get('exclude_watched_by');
  const type = params.get('type');
  const platform = params.get('platform');
  const filterMemberId = params.get('member_id');
  const householdId = params.get('household_id');
  const sort = params.get('sort') || 'newest';
  const limit = parseInt(params.get('limit') || '50', 10);

  let query = supabase
    .from('recommendations')
    .select('*, members!inner(name, household_id, households(name))');

  if (type && type !== 'all') {
    query = query.eq('type', type);
  }

  if (platform) {
    query = query.eq('platform', platform);
  }

  if (filterMemberId) {
    query = query.eq('member_id', filterMemberId);
  }

  if (householdId) {
    query = query.eq('members.household_id', householdId);
  }

  if (sort === 'newest') {
    query = query.order('created_at', { ascending: false });
  } else if (sort === 'top_rated') {
    query = query.order('rating', { ascending: false, nullsFirst: false });
  }

  query = query.limit(limit);

  const { data: recs, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let watchedIds: Set<string> = new Set();
  let watchCounts: Record<string, number> = {};

  if (memberId) {
    const { data: watched } = await supabase
      .from('watched')
      .select('recommendation_id')
      .eq('member_id', memberId);
    watchedIds = new Set((watched || []).map((w) => w.recommendation_id));
  }

  const { data: counts } = await supabase
    .from('watched')
    .select('recommendation_id');

  if (counts) {
    for (const c of counts) {
      watchCounts[c.recommendation_id] = (watchCounts[c.recommendation_id] || 0) + 1;
    }
  }

  // Fetch likes
  const recIds = (recs || []).map((r) => r.id);
  let likeCounts: Record<string, number> = {};
  let myLikes: Set<string> = new Set();

  if (recIds.length > 0) {
    const { data: allLikes } = await supabase
      .from('likes')
      .select('recommendation_id, member_id')
      .in('recommendation_id', recIds);

    if (allLikes) {
      for (const l of allLikes) {
        likeCounts[l.recommendation_id] = (likeCounts[l.recommendation_id] || 0) + 1;
        if (memberId && l.member_id === memberId) {
          myLikes.add(l.recommendation_id);
        }
      }
    }
  }

  const enriched = (recs || [])
    .filter((r) => !watchedIds.has(r.id))
    .map((r) => ({
      ...r,
      recommender_name: (r as any).members?.name || 'Unknown',
      household_name: (r as any).members?.households?.name || null,
      watch_count: watchCounts[r.id] || 0,
      is_watched: false,
      like_count: likeCounts[r.id] || 0,
      is_liked: myLikes.has(r.id),
    }));

  if (sort === 'most_watched') {
    enriched.sort((a, b) => b.watch_count - a.watch_count);
  }

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { member_id, title, type, tmdb_id, poster_url, year, genre, tmdb_rating, platform, comment } = body;

  if (!member_id || !title || !type) {
    return NextResponse.json(
      { error: 'member_id, title, and type required.' },
      { status: 400 }
    );
  }

  // Fetch cast/crew from TMDB if we have a tmdb_id
  let castCrew = null;
  if (tmdb_id) {
    const apiKey = process.env.TMDB_API_KEY;
    if (apiKey) {
      try {
        const mediaType = type === 'show' ? 'tv' : 'movie';
        const creditsRes = await fetch(
          `https://api.themoviedb.org/3/${mediaType}/${tmdb_id}/credits?api_key=${apiKey}`
        );
        const creditsData = await creditsRes.json();

        const cast = (creditsData.cast || [])
          .slice(0, 5)
          .map((c: any) => c.name);

        let directors = (creditsData.crew || [])
          .filter((c: any) => c.job === 'Director')
          .slice(0, 2)
          .map((c: any) => c.name);

        if (mediaType === 'tv' && directors.length === 0) {
          const showRes = await fetch(
            `https://api.themoviedb.org/3/tv/${tmdb_id}?api_key=${apiKey}`
          );
          const showData = await showRes.json();
          directors = (showData.created_by || [])
            .slice(0, 2)
            .map((c: any) => c.name);
        }

        castCrew = { cast, directors };
      } catch {
        // Non-critical, skip
      }
    }
  }

  const { data, error } = await supabase
    .from('recommendations')
    .insert({
      member_id,
      title: title.slice(0, 200),
      type,
      tmdb_id: tmdb_id || null,
      poster_url: poster_url || null,
      year: year || null,
      genre: genre || null,
      tmdb_rating: tmdb_rating || null,
      platform: platform || null,
      rating: null,
      comment: comment ? comment.slice(0, 280) : null,
      cast_crew: castCrew,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
