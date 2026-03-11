import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const memberId = params.get('exclude_watched_by');
  const type = params.get('type');
  const platform = params.get('platform');
  const filterMemberId = params.get('member_id');
  const sort = params.get('sort') || 'newest';
  const limit = parseInt(params.get('limit') || '50', 10);

  let query = supabase
    .from('recommendations')
    .select('*, members(name)');

  if (type && type !== 'all') {
    query = query.eq('type', type);
  }
  if (platform) {
    query = query.eq('platform', platform);
  }
  if (filterMemberId) {
    query = query.eq('member_id', filterMemberId);
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

  if (!recs) {
    return NextResponse.json([]);
  }

  let watchedIds: Set<string> = new Set();
  let watchCounts: Record<string, number> = {};

  if (memberId) {
    const { data: watched } = await supabase
      .from('watched')
      .select('recommendation_id')
      .eq('member_id', memberId);
    if (watched) {
      watchedIds = new Set(watched.map((w) => w.recommendation_id));
    }
  }

  const { data: counts } = await supabase
    .from('watched')
    .select('recommendation_id');

  if (counts) {
    for (const c of counts) {
      watchCounts[c.recommendation_id] = (watchCounts[c.recommendation_id] || 0) + 1;
    }
  }

  // Get comment counts (safely - table might not exist)
  let commentCounts: Record<string, number> = {};
  try {
    const { data: commentData } = await supabase
      .from('comments')
      .select('recommendation_id');
    if (commentData) {
      for (const c of commentData) {
        commentCounts[c.recommendation_id] = (commentCounts[c.recommendation_id] || 0) + 1;
      }
    }
  } catch {}

  const enriched = recs
    .filter((r: any) => !watchedIds.has(r.id))
    .map((r: any) => ({
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
      household_name: null,
      watch_count: watchCounts[r.id] || 0,
      comment_count: commentCounts[r.id] || 0,
      is_watched: false,
      source: r.source || 'manual',
    }));

  if (sort === 'most_watched') {
    enriched.sort((a: any, b: any) => b.watch_count - a.watch_count);
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

  // Check for existing rec with same tmdb_id to prevent duplicates
  if (tmdb_id) {
    const { data: existing } = await supabase
      .from('recommendations')
      .select('*')
      .eq('tmdb_id', Number(tmdb_id))
      .limit(1);
    if (existing && existing.length > 0) {
      return NextResponse.json(existing[0], { status: 200 }); // existing rec, no duplicate // existing rec, no duplicate
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
      rating: rating || null,
      comment: comment ? comment.slice(0, 280) : null,
      source: body.source || 'manual',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}


export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  // Delete cascades: saved, watched, comments will be cleaned up by foreign keys
  const { error } = await supabase
    .from('recommendations')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
