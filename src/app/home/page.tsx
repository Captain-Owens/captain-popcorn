'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Recommendation } from '@/lib/types';
import { STORAGE_KEY_MEMBER, STORAGE_KEY_MEMBER_NAME } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';
import RecommendationCard from '@/components/RecommendationCard';
import SkeletonCard from '@/components/SkeletonCard';
import SlotMachine from '@/components/SlotMachine';

export default function HomePage() {
  const router = useRouter();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState<string>('');
  const [feed, setFeed] = useState<Recommendation[]>([]);
  const [topRated, setTopRated] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [slotOpen, setSlotOpen] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem(STORAGE_KEY_MEMBER);
    const name = localStorage.getItem(STORAGE_KEY_MEMBER_NAME);
    if (!id) {
      router.replace('/pick');
      return;
    }
    setMemberId(id);
    setMemberName(name || '');
  }, [router]);

  const fetchData = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);

    const [feedRes, topRes] = await Promise.all([
      fetch(`/api/recommendations?exclude_watched_by=${memberId}&sort=newest&limit=20`),
      fetch(`/api/recommendations/top?exclude_watched_by=${memberId}`),
    ]);

    const feedData = await feedRes.json();
    const topData = await topRes.json();

    if (Array.isArray(feedData)) setFeed(feedData);
    if (topData) setTopRated(topData);

    setLoading(false);
  }, [memberId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscriptions
  useEffect(() => {
    if (!memberId) return;

    const channel = supabase
      .channel('home-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'recommendations' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'watched' },
        () => fetchData()
      )

      .subscribe();

  
  async function handleDelete(recId: string) {
    if (!memberId) return;

    // Optimistic remove
    setFeed((prev) => prev.filter((r) => r.id !== recId));

    await fetch('/api/recommendations/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendation_id: recId, member_id: memberId }),
    });
  }

  return () => {
      supabase.removeChannel(channel);
    };
  }, [memberId, fetchData]);

  async function handleWatch(recId: string) {
    if (!memberId) return;
    setFeed((prev) => prev.filter((r) => r.id !== recId));

    await fetch('/api/watched', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId, recommendation_id: recId }),
    });
  }

  async function handleUnwatch(recId: string) {
    if (!memberId) return;

    await fetch('/api/watched', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId, recommendation_id: recId }),
    });

    fetchData();
  }

  async function handleLike(recId: string) {
    if (!memberId) return;

    // Optimistic update
    setFeed((prev) =>
      prev.map((r) =>
        r.id === recId
          ? { ...r, is_liked: true, like_count: (r.like_count || 0) + 1 }
          : r
      )
    );

    await fetch('/api/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId, recommendation_id: recId }),
    });
  }

  async function handleUnlike(recId: string) {
    if (!memberId) return;

    // Optimistic update
    setFeed((prev) =>
      prev.map((r) =>
        r.id === recId
          ? { ...r, is_liked: false, like_count: Math.max(0, (r.like_count || 0) - 1) }
          : r
      )
    );

    await fetch('/api/like', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId, recommendation_id: recId }),
    });
  }


  async function handleDelete(recId: string) {
    if (!memberId) return;

    // Optimistic remove
    setFeed((prev) => prev.filter((r) => r.id !== recId));

    await fetch('/api/recommendations/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendation_id: recId, member_id: memberId }),
    });
  }

  return (
    <div className="px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Captain Popcorn</h1>
          <p className="text-sm text-cream/70">Hey, {memberName}</p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY_MEMBER);
            localStorage.removeItem(STORAGE_KEY_MEMBER_NAME);
            router.replace('/pick');
          }}
          className="text-sm text-muted btn-press"
        >
          Switch user
        </button>
      </div>

      {/* Hero section */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {/* I'm Feeling Lucky */}
        <button
          onClick={() => setSlotOpen(true)}
          className="bg-charcoal rounded-card p-4 flex flex-col items-center justify-center gap-3 min-h-[140px] btn-press border border-smoke hover:border-warm-gold transition-colors"
        >
          <div className="text-3xl">🎰</div>
          <span className="text-sm font-bold text-warm-gold text-center leading-tight">
            Feeling lucky?
          </span>
        </button>

        {/* Top Rated / Most Liked */}
        <div className="bg-charcoal rounded-card p-3 flex flex-col min-h-[140px] border border-smoke overflow-hidden">
          <span className="text-xs text-muted mb-2 font-medium">Top pick</span>
          {loading ? (
            <div className="flex-1 flex flex-col gap-2">
              <div className="skeleton flex-1 rounded-btn" />
              <div className="skeleton h-3 w-3/4" />
            </div>
          ) : topRated ? (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 rounded-btn overflow-hidden bg-smoke mb-2">
                {topRated.poster_url ? (
                  <img
                    src={topRated.poster_url}
                    alt={topRated.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted text-sm">
                    🍿
                  </div>
                )}
              </div>
              <p className="text-xs font-medium text-cream truncate">
                {topRated.title}
              </p>
              {topRated.like_count && topRated.like_count > 0 ? (
                <p className="text-xs text-warm-gold">
                  👍 {topRated.like_count}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-muted flex-1 flex items-center">
              No picks yet.
            </p>
          )}
        </div>
      </div>

      {/* Recent feed */}
      <h2 className="text-lg font-bold mb-4">Recently added</h2>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : feed.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🍿</div>
          <p className="text-muted">No recommendations yet.</p>
          <p className="text-muted text-sm">Be the first to add one.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {feed.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                onWatch={handleWatch}
                onUnwatch={handleUnwatch}
                onLike={handleLike}
                onUnlike={handleUnlike}
                onDelete={handleDelete}
                currentMemberId={memberId || undefined}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Slot Machine Modal */}
      <SlotMachine
        isOpen={slotOpen}
        onClose={() => setSlotOpen(false)}
        memberId={memberId || ''}
        onWatch={handleWatch}
      />

      <BottomNav />
    </div>
  );
}
