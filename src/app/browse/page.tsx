'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Recommendation, Member } from '@/lib/types';
import { STORAGE_KEY_MEMBER } from '@/lib/constants';
import { } from '@/lib/constants';
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
  
  const [memberFilter, setMemberFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'top_rated' | 'most_watched'>('newest');
  const [personFilter, setPersonFilter] = useState<string | null>(null);
  const [allPeople, setAllPeople] = useState<string[]>([]);
  const [personSearch, setPersonSearch] = useState('');

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
  
  async function handleDelete(recId: string) {
    if (!memberId) return;

    setRecs((prev) => prev.filter((r) => r.id !== recId));

    await fetch('/api/recommendations/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendation_id: recId, member_id: memberId }),
    });
  }

  return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchData = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);

    const params = new URLSearchParams();
    params.set('exclude_watched_by', memberId);
    params.set('sort', sortBy);
    if (typeFilter !== 'all') params.set('type', typeFilter);

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
    if (Array.isArray(allData)) {
      setAllRecs(allData);
      // Extract all people (cast + directors) for filter
      const peopleSet = new Set<string>();
      for (const rec of allData) {
        const cc = (rec as any).cast_crew;
        if (cc) {
          if (cc.cast) cc.cast.forEach((n: string) => peopleSet.add(n));
          if (cc.directors) cc.directors.forEach((n: string) => peopleSet.add(n));
        }
      }
      setAllPeople(Array.from(peopleSet).sort());
    }

    setLoading(false);
  }, [memberId, typeFilter, memberFilter, sortBy]);

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


  async function handleDelete(recId: string) {
    if (!memberId) return;

    setRecs((prev) => prev.filter((r) => r.id !== recId));

    await fetch('/api/recommendations/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendation_id: recId, member_id: memberId }),
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
              color: typeFilter === t ? '#1C1410' : '#D0C8C0',
            }}
          >
            {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'Shows'}
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

      {/* Person filter */}
      <div className="mb-4 relative">
        <input
          type="text"
          value={personSearch}
          onChange={(e) => setPersonSearch(e.target.value)}
          placeholder="Filter by actor or director..."
          className="w-full"
          style={{ minHeight: 40, fontSize: 14, padding: '8px 12px' }}
        />
        {personSearch.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-charcoal border border-smoke rounded-btn overflow-hidden z-20 max-h-[200px] overflow-y-auto">
            {allPeople
              .filter((p) => p.toLowerCase().includes(personSearch.toLowerCase()))
              .slice(0, 8)
              .map((person) => (
                <button
                  key={person}
                  onClick={() => {
                    setPersonFilter(person);
                    setPersonSearch('');
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-cream hover:bg-smoke btn-press"
                >
                  {person}
                </button>
              ))}
            {allPeople.filter((p) => p.toLowerCase().includes(personSearch.toLowerCase())).length === 0 && (
              <div className="px-3 py-2 text-sm text-muted">No matches</div>
            )}
          </div>
        )}
        {personFilter && (
          <div className="mt-2 flex items-center gap-2">
            <span className="px-3 py-1 bg-warm-gold/20 text-warm-gold rounded-full text-xs font-medium">
              {personFilter}
            </span>
            <button
              onClick={() => setPersonFilter(null)}
              className="text-xs text-muted hover:text-cream btn-press"
            >
              Clear
            </button>
          </div>
        )}
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
            {recs
              .filter((rec) => {
                if (!personFilter) return true;
                const cc = (rec as any).cast_crew;
                if (!cc) return false;
                const allNames = [...(cc.cast || []), ...(cc.directors || [])];
                return allNames.includes(personFilter);
              })
              .map((rec) => (
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
