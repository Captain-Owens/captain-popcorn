import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const memberId = params.get('exclude_watched_by');
  const type = params.get('type');
  const platform = params.get('platform');
  const filterMemberId = params.get('member_id');
  const householdId = params.get('household_id');
  const minRating = params.get('min_rating');
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
  if (minRating) {
    query = query.gte('rating', parseInt(minRating, 10));
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

  // Get comment counts
  let commentCounts: Record<string, number> = {};
  const { data: commentData } = await supabase
    .from('comments')
    .select('recommendation_id');
  if (commentData) {
    for (const c of commentData) {
      commentCounts[c.recommendation_id] = (commentCounts[c.recommendation_id] || 0) + 1;
    }
  }

  const enriched = (recs || [])
    .filter((r) => !watchedIds.has(r.id))
    .map((r) => ({
      ...r,
      recommender_name: (r as any).members?.name || 'Unknown',
      household_name: (r as any).members?.households?.name || null,
      watch_count: watchCounts[r.id] || 0,
      comment_count: commentCounts[r.id] || 0,
      is_watched: false,
    }));

  if (sort === 'most_watched') {
    enriched.sort((a, b) => b.watch_count - a.watch_count);
  }

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { member_id, title, type, tmdb_id, poster_url, year, genre, tmdb_rating, platform, rating, comment } = body;

  if (!member_id || !title || !type) {
    return NextResponse.json(
      { error: 'member_id, title, and type required.' },
      { status: 400 }
    );
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
      rating: rating || null,
      comment: comment ? comment.slice(0, 280) : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
