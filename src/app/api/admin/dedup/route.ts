import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  // Find all duplicates by tmdb_id or case-insensitive title
  const { data: recs, error } = await supabase
    .from('recommendations')
    .select('id, title, tmdb_id, created_at, member_id, members(name)')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by tmdb_id first, then by lowercase title
  const groups: Record<string, typeof recs> = {};

  for (const rec of recs || []) {
    const key = rec.tmdb_id
      ? `tmdb:${rec.tmdb_id}`
      : `title:${rec.title.toLowerCase().trim()}`;

    if (!groups[key]) groups[key] = [];
    groups[key].push(rec);
  }

  // Filter to only groups with 2+ entries (actual duplicates)
  const duplicates = Object.entries(groups)
    .filter(([, items]) => items.length > 1)
    .map(([key, items]) => ({
      key,
      title: items[0].title,
      count: items.length,
      entries: items.map((i: any) => ({
        id: i.id,
        title: i.title,
        added_by: i.members?.name || 'Unknown',
        created_at: i.created_at,
      })),
    }));

  return NextResponse.json({
    duplicate_groups: duplicates.length,
    total_duplicates: duplicates.reduce((sum, g) => sum + g.count - 1, 0),
    groups: duplicates,
  });
}

export async function DELETE() {
  // Find and remove duplicates, keeping the oldest entry
  const { data: recs, error } = await supabase
    .from('recommendations')
    .select('id, title, tmdb_id, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const groups: Record<string, string[]> = {};

  for (const rec of recs || []) {
    const key = rec.tmdb_id
      ? `tmdb:${rec.tmdb_id}`
      : `title:${rec.title.toLowerCase().trim()}`;

    if (!groups[key]) groups[key] = [];
    groups[key].push(rec.id);
  }

  const toDelete: string[] = [];

  for (const [, ids] of Object.entries(groups)) {
    if (ids.length > 1) {
      const keepId = ids[0]; // oldest (sorted by created_at asc)
      const dupeIds = ids.slice(1);

      // Move watched records from dupes to keeper
      for (const dupeId of dupeIds) {
        await supabase
          .from('watched')
          .update({ recommendation_id: keepId })
          .eq('recommendation_id', dupeId);

        // Move comments from dupes to keeper
        await supabase
          .from('comments')
          .update({ recommendation_id: keepId })
          .eq('recommendation_id', dupeId);
      }

      toDelete.push(...dupeIds);
    }
  }

  if (toDelete.length === 0) {
    return NextResponse.json({ message: 'No duplicates found', deleted: 0 });
  }

  const { error: delError } = await supabase
    .from('recommendations')
    .delete()
    .in('id', toDelete);

  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 });
  }

  return NextResponse.json({
    message: `Removed ${toDelete.length} duplicate(s)`,
    deleted: toDelete.length,
    deleted_ids: toDelete,
  });
}
