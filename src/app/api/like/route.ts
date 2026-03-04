import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { member_id, recommendation_id } = await req.json();

  if (!member_id || !recommendation_id) {
    return NextResponse.json(
      { error: 'member_id and recommendation_id required.' },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('likes')
    .insert({ member_id, recommendation_id });

  if (error) {
    // If duplicate, that's fine
    if (error.code === '23505') {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { member_id, recommendation_id } = await req.json();

  if (!member_id || !recommendation_id) {
    return NextResponse.json(
      { error: 'member_id and recommendation_id required.' },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('member_id', member_id)
    .eq('recommendation_id', recommendation_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
