import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  // Get all members
  const { data: members } = await supabase
    .from('members')
    .select('id, name')
    .order('name');

  if (!members) return NextResponse.json([]);

  // Get all watched entries with recommendation details
  const { data: watched } = await supabase
    .from('watched')
    .select('member_id, recommendation_id, created_at, recommendations(id, title, poster_url, type, year, tmdb_rating)')
    .order('created_at', { ascending: false });

  if (!watched) return NextResponse.json([]);

  // Group by member
  const memberMap: Record<string, { name: string; items: any[] }> = {};
  for (const m of members) {
    memberMap[m.id] = { name: m.name, items: [] };
  }

  for (const w of watched) {
    if (memberMap[w.member_id] && (w as any).recommendations) {
      const rec = (w as any).recommendations;
      memberMap[w.member_id].items.push({
        id: rec.id,
        title: rec.title,
        poster_url: rec.poster_url,
        type: rec.type,
        year: rec.year,
        tmdb_rating: rec.tmdb_rating,
        watched_at: w.created_at,
      });
    }
  }

  // Convert to array, only include members with watched items
  const result = Object.entries(memberMap)
    .filter(([_, v]) => v.items.length > 0)
    .map(([id, v]) => ({
      member_id: id,
      member_name: v.name,
      count: v.items.length,
      items: v.items,
    }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json(result);
}
