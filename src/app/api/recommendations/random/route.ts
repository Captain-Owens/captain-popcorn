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

  let query = supabase
    .from('recommendations')
    .select('*, members!inner(name, household_id, households(name))');

  if (watchedIds.length > 0) {
    query = query.not('id', 'in', `(${watchedIds.join(',')})`);
  }

  const { data: all } = await query;

  if (!all || all.length === 0) {
    return NextResponse.json(null);
  }

  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  const weighted = all.map((rec) => {
    let weight = 1;
    if (rec.rating) weight += rec.rating * 2;
    const age = now - new Date(rec.created_at).getTime();
    if (age < oneWeek) weight += 5;
    else if (age < oneWeek * 4) weight += 2;
    return { rec, weight };
  });

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  let pick = weighted[0].rec;
  for (const w of weighted) {
    random -= w.weight;
    if (random <= 0) {
      pick = w.rec;
      break;
    }
  }

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
