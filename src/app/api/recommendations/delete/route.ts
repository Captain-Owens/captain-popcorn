import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { recommendation_id, member_id } = await req.json();

  if (!recommendation_id || !member_id) {
    return NextResponse.json(
      { error: 'recommendation_id and member_id required.' },
      { status: 400 }
    );
  }

  // Verify ownership
  const { data: rec } = await supabase
    .from('recommendations')
    .select('member_id')
    .eq('id', recommendation_id)
    .single();

  if (!rec || rec.member_id !== member_id) {
    return NextResponse.json(
      { error: 'Not authorized to delete this.' },
      { status: 403 }
    );
  }

  // Delete related data first
  await supabase.from('likes').delete().eq('recommendation_id', recommendation_id);
  await supabase.from('watched').delete().eq('recommendation_id', recommendation_id);
  await supabase.from('recommendations').delete().eq('id', recommendation_id);

  return NextResponse.json({ ok: true });
}
