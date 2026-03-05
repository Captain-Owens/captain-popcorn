import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get('member_id');
  if (!memberId) {
    return NextResponse.json({ error: 'member_id required' }, { status: 400 });
  }

  // Get saved recommendation IDs
  const { data: saved, error: savedError } = await supabase
    .from('saved')
    .select('recommendation_id')
    .eq('member_id', memberId);

  if (savedError) {
    return NextResponse.json({ error: savedError.message }, { status: 500 });
  }

  if (!saved || saved.length === 0) {
    return NextResponse.json([]);
  }

  const recIds = saved.map((s) => s.recommendation_id);

  // Get full recommendation data
  const { data: recs, error: recsError } = await supabase
    .from('recommendations')
    .select('*, members(name)')
    .in('id', recIds);

  if (recsError) {
    return NextResponse.json({ error: recsError.message }, { status: 500 });
  }

  const enriched = (recs || []).map((r: any) => ({
    id: r.id,
    member_id: r.member_id,
    title: r.title || '',
    type: r.type || 'movie',
    tmdb_id: r.tmdb_id || null,
    poster_url: r.poster_url || null,
    year: r.year || null,
    genre: r.genre || null,
    tmdb_rating: r.tmdb_rating || null,
    platform: r.platform || null,
    rating: r.rating || null,
    comment: r.comment || null,
    created_at: r.created_at,
    recommender_name: r.members?.name || 'Unknown',
    watch_count: 0,
    comment_count: 0,
    is_watched: false,
    is_saved: true,
  }));

  return NextResponse.json(enriched);
}
