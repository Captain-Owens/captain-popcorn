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

  const enriched = (data || []).map((c: any) => ({
    id: c.id,
    text: c.text,
    member_name: c.members?.name || 'Unknown',
    member_id: c.member_id,
    created_at: c.created_at,
  }));

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const { member_id, recommendation_id, text } = await req.json();

  if (!member_id || !recommendation_id || !text?.trim()) {
    return NextResponse.json(
      { error: 'member_id, recommendation_id, and text required.' },
      { status: 400 }
    );
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
    member_name: (data as any).members?.name || 'Unknown',
    member_id: data.member_id,
    created_at: data.created_at,
  }, { status: 201 });
}
