'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Recommendation } from '@/lib/types';
import { STORAGE_KEY_MEMBER, STORAGE_KEY_MEMBER_NAME } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';
import RecommendationCard from '@/components/RecommendationCard';
import SkeletonCard from '@/components/SkeletonCard';
import SlotMachine from '@/components/SlotMachine';
import CommentsSheet from '@/components/CommentsSheet';

const DiscoverCarousel = dynamic(
  () => import('@/components/DiscoverCarousel').catch(() => {
    return { default: () => null };
  }),
  { ssr: false }
);

export default function HomePage() {
  const router = useRouter();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState<string>('');
  const [feed, setFeed] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotOpen, setSlotOpen] = useState(false);
  const [showCount, setShowCount] = useState(5);
  const [discoverItems, setDiscoverItems] = useState<any[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(true);

  // Comments
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsRecId, setCommentsRecId] = useState('');
  const [commentsRecTitle, setCommentsRecTitle] = useState('');

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

    try {
      const res = await fetch(`/api/recommendations?exclude_watched_by=${memberId}&sort=newest&limit=30`);
      const data = await res.json();
      if (Array.isArray(data)) setFeed(data);
    } catch {}
    setLoading(false);
  }, [memberId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch discover items
  useEffect(() => {
    if (!memberId) return;
    setDiscoverLoading(true);
    fetch('/api/discover')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDiscoverItems(data);
        setDiscoverLoading(false);
      })
      .catch(() => setDiscoverLoading(false));
  }, [memberId]);

  // Realtime
  useEffect(() => {
    if (!memberId) return;
    const channel = supabase
      .channel('home-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'recommendations' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'watched' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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

  function handleOpenComments(recId: string, recTitle: string) {
    setCommentsRecId(recId);
    setCommentsRecTitle(recTitle);
    setCommentsOpen(true);
  }

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  const visibleFeed = feed ? feed.slice(0, showCount) : [];
  const remaining = feed ? feed.length - showCount : 0;

  return (
    <div className="px-4 py-6 pb-24">
      {/* Logo */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold" style={{ color: '#E8A317' }}>
          🍿 Captain Popcorn
        </h1>
      </div>

      {/* Greeting */}
      <div className="text-center mb-6">
        <p className="text-lg text-cream">
          {getGreeting()}, {memberName}
        </p>
        <button
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY_MEMBER);
            localStorage.removeItem(STORAGE_KEY_MEMBER_NAME);
            router.replace('/pick');
          }}
          className="text-xs text-muted underline btn-press mt-1"
        >
          Switch user
        </button>
      </div>

      {/* Feeling Lucky - BIG hero button */}
      <button
        onClick={() => setSlotOpen(true)}
        className="w-full rounded-card flex flex-col items-center justify-center gap-3 min-h-[140px] btn-press border-2 border-warm-gold mb-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #2A2A2A 0%, #1A1A1A 50%, #2A2A2A 100%)',
          animation: 'lucky-glow 3s ease-in-out infinite',
          boxShadow: '0 0 30px rgba(232, 163, 23, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <span className="text-5xl" style={{ filter: 'drop-shadow(0 2px 8px rgba(232,163,23,0.4))' }}>🎰</span>
        <span className="text-lg font-bold text-warm-gold tracking-wide">I'm Feeling Lucky</span>
        <span className="text-xs text-muted">Tap for a random pick from the crew</span>
      </button>

      {/* Discover Carousel */}
      {memberId && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">Discover</h2>
          <DiscoverCarousel items={discoverItems} loading={discoverLoading} />
        </div>
      )}

      {/* Recently added */}
      <h2 className="text-lg font-bold mb-4">Recently added</h2>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : visibleFeed.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🍿</div>
          <p className="text-muted">No recommendations yet.</p>
          <p className="text-muted text-sm">Be the first to add one.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {visibleFeed.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  rec={rec}
                  onWatch={handleWatch}
                  onUnwatch={handleUnwatch}
                  onComment={handleOpenComments}
                />
              ))}
            </AnimatePresence>
          </div>
          {remaining > 0 && (
            <button
              onClick={() => setShowCount((c) => c + 5)}
              className="w-full mt-4 py-3 bg-charcoal rounded-btn text-sm text-muted font-medium btn-press min-h-[44px]"
            >
              Show more ({remaining} remaining)
            </button>
          )}
        </>
      )}

      <SlotMachine
        isOpen={slotOpen}
        onClose={() => setSlotOpen(false)}
        memberId={memberId || ''}
        onWatch={handleWatch}
      />

      <CommentsSheet
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        recommendationId={commentsRecId}
        recommendationTitle={commentsRecTitle}
        memberId={memberId || ''}
      />

      <BottomNav />
    </div>
  );
}
