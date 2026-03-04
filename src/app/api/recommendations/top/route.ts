import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get('exclude_watched_by');

  let watchedIds: string[] = [];

  if (memberId) {
    const { data: watched } = await supabase
      .from('watched')
      .select('recommendation_id')
      .eq('member_id', memberId);
    watchedIds = (watched || []).map((w) => w.recommendation_id);
  }

  // Get all recommendations
  let query = supabase
    .from('recommendations')
    .select('*, members!inner(name, household_id, households(name))');

  if (watchedIds.length > 0) {
    query = query.not('id', 'in', '(' + watchedIds.join(',') + ')');
  }

  const { data: recs } = await query;

  if (!recs || recs.length === 0) {
    return NextResponse.json(null);
  }

  // Get all likes and count per recommendation
  const recIds = recs.map((r) => r.id);
  const { data: allLikes } = await supabase
    .from('likes')
    .select('recommendation_id')
    .in('recommendation_id', recIds);

  const likeCounts: Record<string, number> = {};
  if (allLikes) {
    for (const l of allLikes) {
      likeCounts[l.recommendation_id] = (likeCounts[l.recommendation_id] || 0) + 1;
    }
  }

  // Sort by most likes, then by newest as tiebreaker
  const sorted = recs
    .map((r) => ({ ...r, like_count: likeCounts[r.id] || 0 }))
    .sort((a, b) => {
      if (b.like_count !== a.like_count) return b.like_count - a.like_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const pick = sorted[0];

  const { data: counts } = await supabase
    .from('watched')
    .select('recommendation_id')
    .eq('recommendation_id', pick.id);

  const result = {
    ...pick,
    recommender_name: (pick as any).members?.name || 'Unknown',
    household_name: (pick as any).members?.households?.name || null,
    watch_count: counts?.length || 0,
    is_watched: false,
  };

  return NextResponse.json(result);
}
