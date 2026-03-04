import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get('exclude_watched_by');

  let watchedIds: string[] = [];
  let myLikedIds: string[] = [];

  if (memberId) {
    const { data: watched } = await supabase
      .from('watched')
      .select('recommendation_id')
      .eq('member_id', memberId);
    watchedIds = (watched || []).map((w) => w.recommendation_id);

    // Get what I've liked
    const { data: myLikes } = await supabase
      .from('likes')
      .select('recommendation_id')
      .eq('member_id', memberId);
    myLikedIds = (myLikes || []).map((l) => l.recommendation_id);
  }

  // Get all recs
  const { data: allRecs } = await supabase
    .from('recommendations')
    .select('*, members!inner(name, household_id, households(name))');

  if (!allRecs || allRecs.length === 0) {
    return NextResponse.json(null);
  }

  // Filter to unwatched
  const pool = allRecs.filter((r) => !watchedIds.includes(r.id));
  if (pool.length === 0) {
    return NextResponse.json(null);
  }

  // Get all likes for collaborative filtering
  const { data: allLikes } = await supabase
    .from('likes')
    .select('member_id, recommendation_id');

  // Build taste similarity: find users who liked the same stuff I liked
  const userLikes: Record<string, Set<string>> = {};
  if (allLikes) {
    for (const l of allLikes) {
      if (!userLikes[l.member_id]) userLikes[l.member_id] = new Set();
      userLikes[l.member_id].add(l.recommendation_id);
    }
  }

  // Score each rec in the pool
  const myLikedSet = new Set(myLikedIds);
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  const scored = pool.map((rec) => {
    let score = 1;

    // Collaborative filtering: boost recs liked by users with similar taste
    if (memberId && myLikedSet.size > 0) {
      for (const [userId, likedSet] of Object.entries(userLikes)) {
        if (userId === memberId) continue;
        // How many of my likes does this user share?
        let overlap = 0;
        for (const id of myLikedIds) {
          if (likedSet.has(id)) overlap++;
        }
        // If similar user liked this rec, boost it
        if (overlap > 0 && likedSet.has(rec.id)) {
          score += overlap * 3;
        }
      }
    }

    // Boost by total likes
    const recLikes = allLikes
      ? allLikes.filter((l) => l.recommendation_id === rec.id).length
      : 0;
    score += recLikes * 2;

    // Recency bonus
    const age = now - new Date(rec.created_at).getTime();
    if (age < oneWeek) score += 4;
    else if (age < oneWeek * 4) score += 2;

    // High TMDB rating bonus
    if (rec.tmdb_rating && rec.tmdb_rating >= 8) score += 2;

    return { rec, score };
  });

  // Weighted random selection
  const totalScore = scored.reduce((sum, s) => sum + s.score, 0);
  let rand = Math.random() * totalScore;

  let pick = scored[0].rec;
  for (const s of scored) {
    rand -= s.score;
    if (rand <= 0) {
      pick = s.rec;
      break;
    }
  }

  const { data: counts } = await supabase
    .from('watched')
    .select('recommendation_id')
    .eq('recommendation_id', pick.id);

  const likesForPick = allLikes
    ? allLikes.filter((l) => l.recommendation_id === pick.id).length
    : 0;

  const result = {
    ...pick,
    recommender_name: (pick as any).members?.name || 'Unknown',
    household_name: (pick as any).members?.households?.name || null,
    watch_count: counts?.length || 0,
    like_count: likesForPick,
    is_watched: false,
  };

  return NextResponse.json(result);
}
