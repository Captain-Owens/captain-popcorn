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
import DiscoverCarousel from '@/components/DiscoverCarousel';

interface DiscoverItem {
  id: number;
  title: string;
  poster_url: string | null;
  year: number | null;
  genre: string | null;
  tmdb_rating: number | null;
  type: 'movie' | 'show';
  overview?: string;
  reason?: string;
}

const ITEMS_PER_PAGE = 5;

export default function HomePage() {
  const router = useRouter();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState<string>('');
  const [feed, setFeed] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotOpen, setSlotOpen] = useState(false);
  const [discovers, setDiscovers] = useState<DiscoverItem[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

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

    const feedRes = await fetch(
      `/api/recommendations?exclude_watched_by=${memberId}&sort=newest&limit=20`
    );
    const feedData = await feedRes.json();
    if (Array.isArray(feedData)) setFeed(feedData);

    setLoading(false);
  }, [memberId]);

  const fetchDiscover = useCallback(async () => {
    setDiscoverLoading(true);
    try {
      const res = await fetch('/api/discover');
      const data = await res.json();
      if (Array.isArray(data)) setDiscovers(data);
    } catch {
      setDiscovers([]);
    }
    setDiscoverLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    fetchDiscover();
  }, [fetchData, fetchDiscover]);

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

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const visibleFeed = feed.slice(0, visibleCount);
  const hasMore = feed.length > visibleCount;

  return (
    <div className="px-4 py-6 pb-24 page-enter">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold">
          {greeting} {memberName}, whatcha feeling tonight?
        </h1>
        <button
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY_MEMBER);
            localStorage.removeItem(STORAGE_KEY_MEMBER_NAME);
            router.replace('/pick');
          }}
          className="text-xs text-muted underline btn-press mt-1"
          style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}
        >
          Switch user
        </button>
      </div>

      {/* Feeling Lucky - big, glowing, distinct */}
      <button
        onClick={() => setSlotOpen(true)}
        className="w-full rounded-card p-6 flex items-center justify-center gap-4 mb-6 btn-press lucky-glow"
        style={{
          minHeight: 100,
          background: 'linear-gradient(135deg, #2A2A2A 0%, #1A1A1A 100%)',
        }}
      >
        <motion.div
          className="text-5xl"
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          🎰
        </motion.div>
        <div className="text-left">
          <span className="text-lg font-bold text-warm-gold">Feeling lucky?</span>
          <p className="text-xs text-muted mt-0.5">Spin for a random pick</p>
        </div>
      </button>

      {/* Discover carousel - full width */}
      <div className="mb-6">
        <DiscoverCarousel
          items={discovers}
          loading={discoverLoading}
        />
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
          <div className="text-5xl mb-4">🍿</div>
          <p className="text-cream font-medium text-lg mb-1">No recommendations yet</p>
          <p className="text-muted text-sm mb-4">Be the first to add a pick for the crew.</p>
          <button
            onClick={() => router.push('/add')}
            className="px-6 py-3 bg-warm-gold text-rich-black rounded-btn font-bold btn-press"
            style={{ minHeight: 44 }}
          >
            Add a pick
          </button>
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
                />
              ))}
            </AnimatePresence>
          </div>

          {hasMore && (
            <button
              onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
              className="w-full mt-4 py-3 text-sm text-muted font-medium btn-press rounded-btn border border-smoke hover:border-warm-gold transition-colors"
              style={{ minHeight: 44 }}
            >
              Show more ({feed.length - visibleCount} remaining)
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

      <BottomNav />
    </div>
  );
}
