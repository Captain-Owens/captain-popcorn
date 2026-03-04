import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const recId = req.nextUrl.searchParams.get('recommendation_id');
  if (!recId) {
    return NextResponse.json({ error: 'recommendation_id required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('comments')
    .select('*, members(name)')
    .eq('recommendation_id', recId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const comments = (data || []).map((c: any) => ({
    id: c.id,
    text: c.text,
    member_id: c.member_id,
    member_name: c.members?.name || 'Unknown',
    recommendation_id: c.recommendation_id,
    created_at: c.created_at,
  }));

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { member_id, recommendation_id, text } = body;

  if (!member_id || !recommendation_id || !text?.trim()) {
    return NextResponse.json({ error: 'member_id, recommendation_id, text required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      member_id,
      recommendation_id,
      text: text.trim().slice(0, 500),
    })
    .select('*, members(name)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    text: data.text,
    member_id: data.member_id,
    member_name: (data as any).members?.name || 'Unknown',
    recommendation_id: data.recommendation_id,
    created_at: data.created_at,
  }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { comment_id, member_id } = body;

  if (!comment_id || !member_id) {
    return NextResponse.json({ error: 'comment_id and member_id required' }, { status: 400 });
  }

  // Only allow deleting your own comments
  const { data: comment } = await supabase
    .from('comments')
    .select('member_id')
    .eq('id', comment_id)
    .single();

  if (!comment || comment.member_id !== member_id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', comment_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Deleted' });
}
