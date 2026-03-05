import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  // Get all members
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('id, name')
    .order('name');

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 });
  }

  if (!members || members.length === 0) {
    return NextResponse.json([]);
  }

  // Get all watched entries with recommendation details
  const { data: watched, error: watchedError } = await supabase
    .from('watched')
    .select('member_id, recommendation_id, recommendations(title, poster_url, year, tmdb_rating)');

  if (watchedError) {
    return NextResponse.json({ error: watchedError.message }, { status: 500 });
  }

  // Group by member
  const result = members
    .map((member) => {
      const memberWatched = (watched || []).filter((w: any) => w.member_id === member.id);
      return {
        id: member.id,
        name: member.name,
        watched_count: memberWatched.length,
        items: memberWatched.map((w: any) => ({
          title: w.recommendations?.title || 'Unknown',
          poster_url: w.recommendations?.poster_url || null,
          year: w.recommendations?.year || null,
          tmdb_rating: w.recommendations?.tmdb_rating || null,
        })),
      };
    })
    .filter((m) => m.watched_count > 0)
    .sort((a, b) => b.watched_count - a.watched_count);

  return NextResponse.json(result);
}
