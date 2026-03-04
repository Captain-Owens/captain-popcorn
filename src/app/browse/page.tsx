'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Recommendation, Member, Platform } from '@/lib/types';
import { STORAGE_KEY_MEMBER } from '@/lib/constants';
import { PLATFORMS } from '@/lib/constants';
import BottomNav from '@/components/BottomNav';
import RecommendationCard from '@/components/RecommendationCard';
import SkeletonCard from '@/components/SkeletonCard';
import SearchOverlay from '@/components/SearchOverlay';

export default function BrowsePage() {
  const router = useRouter();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [allRecs, setAllRecs] = useState<Recommendation[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'show'>('all');
  const [platformFilter, setPlatformFilter] = useState<Platform | null>(null);
  const [memberFilter, setMemberFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'top_rated' | 'most_watched'>('newest');

  useEffect(() => {
    const id = localStorage.getItem(STORAGE_KEY_MEMBER);
    if (!id) {
      router.replace('/pick');
      return;
    }
    setMemberId(id);
  }, [router]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchData = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);

    const params = new URLSearchParams();
    params.set('exclude_watched_by', memberId);
    params.set('sort', sortBy);
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (platformFilter) params.set('platform', platformFilter);
    if (memberFilter) params.set('member_id', memberFilter);

    const [recsRes, membersRes, allRes] = await Promise.all([
      fetch(`/api/recommendations?${params.toString()}`),
      fetch('/api/members'),
      fetch(`/api/recommendations?limit=100`),
    ]);

    const recsData = await recsRes.json();
    const membersData = await membersRes.json();
    const allData = await allRes.json();

    if (Array.isArray(recsData)) setRecs(recsData);
    if (Array.isArray(membersData)) setMembers(membersData);
    if (Array.isArray(allData)) setAllRecs(allData);

    setLoading(false);
  }, [memberId, typeFilter, platformFilter, memberFilter, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleWatch(recId: string) {
    if (!memberId) return;
    setRecs((prev) => prev.filter((r) => r.id !== recId));

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

    setRecs((prev) =>
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

    setRecs((prev) =>
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

  return (
    <div className="px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Browse</h1>
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-charcoal rounded-btn text-sm text-muted btn-press min-h-[40px]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline text-xs bg-smoke px-1.5 py-0.5 rounded text-muted">⌘K</kbd>
        </button>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 mb-3">
        {(['all', 'movie', 'show'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className="px-3 py-2 rounded-btn text-xs font-medium btn-press min-h-[36px] transition-colors"
            style={{
              backgroundColor: typeFilter === t ? '#E8A317' : '#2B2219',
              color: typeFilter === t ? '#1C1410' : '#8A8A7A',
            }}
          >
            {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'Shows'}
          </button>
        ))}
      </div>

      {/* Platform filter */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {PLATFORMS.map((p) => (
          <button
            key={p.slug}
            onClick={() => setPlatformFilter(platformFilter === p.slug ? null : p.slug)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium btn-press transition-colors"
            style={{
              backgroundColor: platformFilter === p.slug ? p.color + '22' : '#2B2219',
              color: platformFilter === p.slug ? p.color : '#8A8A7A',
              border: `1px solid ${platformFilter === p.slug ? p.color : '#3D3228'}`,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Member filter + Sort */}
      <div className="flex gap-2 mb-6">
        <select
          value={memberFilter || ''}
          onChange={(e) => setMemberFilter(e.target.value || null)}
          className="flex-1 bg-charcoal border border-smoke rounded-btn px-3 py-2 text-sm text-cream min-h-[40px]"
        >
          <option value="">Everyone</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="bg-charcoal border border-smoke rounded-btn px-3 py-2 text-sm text-cream min-h-[40px]"
        >
          <option value="newest">Newest</option>
          <option value="top_rated">Most liked</option>
          <option value="most_watched">Most watched</option>
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : recs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted">Nothing here.</p>
          <p className="text-sm text-muted mt-1">Try different filters.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {recs.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                onWatch={handleWatch}
                onUnwatch={handleUnwatch}
                onLike={handleLike}
                onUnlike={handleUnlike}
                currentMemberId={memberId || undefined}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        recommendations={allRecs}
        onWatch={handleWatch}
        onUnwatch={handleUnwatch}
      />

      <BottomNav />
    </div>
  );
}
