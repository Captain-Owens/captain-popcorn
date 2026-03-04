'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { STORAGE_KEY_MEMBER, STORAGE_KEY_MEMBER_NAME } from '@/lib/constants';
import { Member } from '@/lib/types';

export default function PickPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoin, setShowJoin] = useState(false);
  const [joinName, setJoinName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    const { data } = await supabase
      .from('members')
      .select('*')
      .order('name');
    setMembers(data || []);
    setLoading(false);
  }

  async function handlePickMember(member: Member) {
    if (adminMode) {
      setConfirmDelete(member.id);
      return;
    }
    localStorage.setItem(STORAGE_KEY_MEMBER, member.id);
    localStorage.setItem(STORAGE_KEY_MEMBER_NAME, member.name);
    router.replace('/home');
  }

  async function handleDeleteMember(memberId: string) {
    // Delete likes, watched, recommendations, then member
    await supabase.from('likes').delete().eq('member_id', memberId);
    await supabase.from('watched').delete().eq('member_id', memberId);
    await supabase.from('recommendations').delete().eq('member_id', memberId);
    await supabase.from('members').delete().eq('id', memberId);
    setConfirmDelete(null);
    fetchMembers();
  }

  async function handleJoin() {
    if (!joinName.trim()) return;
    setSubmitting(true);

    let householdId: string | null = null;

    if (partnerName.trim()) {
      const { data: household } = await supabase
        .from('households')
        .insert({ name: `The ${joinName.trim()} household` })
        .select()
        .single();
      householdId = household?.id || null;
    }

    const { data: member } = await supabase
      .from('members')
      .insert({
        name: joinName.trim(),
        household_id: householdId,
      })
      .select()
      .single();

    if (member) {
      if (partnerName.trim() && householdId) {
        await supabase
          .from('members')
          .insert({
            name: partnerName.trim(),
            household_id: householdId,
          });
      }

      localStorage.setItem(STORAGE_KEY_MEMBER, member.id);
      localStorage.setItem(STORAGE_KEY_MEMBER_NAME, member.name);
      router.replace('/home');
    }

    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="text-muted">Loading crew...</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 min-h-dvh flex flex-col">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Captain Popcorn</h1>
        <p className="text-muted">Who are you?</p>
      </div>

      {members.length > 0 && !showJoin && (
        <div className="flex flex-col gap-3 mb-6">
          {members.map((member) => (
            <div key={member.id} className="relative">
              <button
                onClick={() => handlePickMember(member)}
                className={`w-full py-4 px-6 rounded-card text-left text-lg font-medium btn-press min-h-[56px] transition-colors ${
                  adminMode
                    ? 'bg-deep-red/20 border-2 border-deep-red/50 text-cream'
                    : 'bg-charcoal text-cream hover:bg-smoke'
                }`}
              >
                {adminMode && <span className="mr-2">✕</span>}
                {member.name}
              </button>

              {/* Delete confirmation */}
              {confirmDelete === member.id && (
                <div className="absolute inset-0 bg-charcoal rounded-card flex items-center justify-center gap-3 px-4 z-10 border-2 border-deep-red">
                  <span className="text-sm text-cream">Delete {member.name}?</span>
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="px-3 py-1.5 bg-deep-red text-cream rounded-btn text-sm font-bold btn-press"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-3 py-1.5 bg-smoke text-muted rounded-btn text-sm font-bold btn-press"
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!showJoin ? (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowJoin(true)}
            className="w-full py-4 px-6 bg-warm-gold text-rich-black rounded-btn font-bold text-lg btn-press min-h-[56px]"
          >
            Join the crew
          </button>
          <button
            onClick={() => {
              setAdminMode(!adminMode);
              setConfirmDelete(null);
            }}
            className={`text-sm btn-press py-2 ${
              adminMode ? 'text-deep-red font-bold' : 'text-muted'
            }`}
          >
            {adminMode ? 'Done managing' : 'Manage users'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-muted mb-2">Your name</label>
            <input
              type="text"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              placeholder="First name"
              autoFocus
              maxLength={50}
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-2">
              Partner name (optional)
            </label>
            <input
              type="text"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="Their first name"
              maxLength={50}
            />
          </div>
          <button
            onClick={handleJoin}
            disabled={!joinName.trim() || submitting}
            className="w-full py-4 px-6 bg-warm-gold text-rich-black rounded-btn font-bold text-lg btn-press min-h-[56px] disabled:opacity-50"
          >
            {submitting ? 'Joining...' : 'Join the crew'}
          </button>
          <button
            onClick={() => setShowJoin(false)}
            className="text-muted text-sm underline"
          >
            Go back
          </button>
        </div>
      )}
    </div>
  );
}
