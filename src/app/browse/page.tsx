'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Recommendation, Member } from '@/lib/types';
import { STORAGE_KEY_MEMBER } from '@/lib/constants';
import BottomNav from '@/components/BottomNav';
import RecommendationCard from '@/components/RecommendationCard';
import SkeletonCard from '@/components/SkeletonCard';
import SearchOverlay from '@/components/SearchOverlay';
import CommentsSheet from '@/components/CommentsSheet';

interface WatchedMember {
  id: string;
  name: string;
  watched_count: number;
  items: { title: string; poster_url: string | null; year: number | null; tmdb_rating: number | null }[];
}

export default function BrowsePage() {
  const router = useRouter();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [allRecs, setAllRecs] = useState<Recommendation[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'browse' | 'watched'>('browse');
  const [watchedMembers, setWatchedMembers] = useState<WatchedMember[]>([]);
  const [watchedLoading, setWatchedLoading] = useState(false);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'show'>('all');
  const [memberFilter, setMemberFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'top_rated' | 'most_watched'>('newest');

  // Comments
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsRecId, setCommentsRecId] = useState('');
  const [commentsRecTitle, setCommentsRecTitle] = useState('');

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
  }, [memberId, typeFilter, memberFilter, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch watched list
  useEffect(() => {
    if (activeTab === 'watched') {
      setWatchedLoading(true);
      fetch('/api/watched/list')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setWatchedMembers(data);
          setWatchedLoading(false);
        })
        .catch(() => setWatchedLoading(false));
    }
  }, [activeTab]);

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

  function handleOpenComments(recId: string, recTitle: string) {
    setCommentsRecId(recId);
    setCommentsRecTitle(recTitle);
    setCommentsOpen(true);
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
        </button>
      </div>

      {/* Browse / Watched tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('browse')}
          className="px-4 py-2 rounded-btn text-sm font-medium btn-press min-h-[40px]"
          style={{
            backgroundColor: activeTab === 'browse' ? '#E8A317' : '#2A2A2A',
            color: activeTab === 'browse' ? '#1A1A1A' : '#8A8A7A',
          }}
        >
          Browse
        </button>
        <button
          onClick={() => setActiveTab('watched')}
          className="px-4 py-2 rounded-btn text-sm font-medium btn-press min-h-[40px]"
          style={{
            backgroundColor: activeTab === 'watched' ? '#E8A317' : '#2A2A2A',
            color: activeTab === 'watched' ? '#1A1A1A' : '#8A8A7A',
          }}
        >
          Watched
        </button>
      </div>

      {activeTab === 'browse' ? (
        <>
          {/* Type filter */}
          <div className="flex gap-2 mb-3">
            {(['all', 'movie', 'show'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className="px-3 py-2 rounded-btn text-xs font-medium btn-press min-h-[36px] transition-colors"
                style={{
                  backgroundColor: typeFilter === t ? '#E8A317' : '#2A2A2A',
                  color: typeFilter === t ? '#1A1A1A' : '#8A8A7A',
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
              <option value="top_rated">Top rated</option>
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
                    onComment={handleOpenComments}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      ) : (
        /* Watched tab */
        <div>
          {watchedLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-charcoal rounded-card p-4">
                  <div className="skeleton h-5 w-32 mb-2" />
                  <div className="skeleton h-3 w-20" />
                </div>
              ))}
            </div>
          ) : watchedMembers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted">Nobody has watched anything yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {watchedMembers.map((wm) => (
                <div key={wm.id} className="bg-charcoal rounded-card overflow-hidden">
                  <button
                    onClick={() => setExpandedMember(expandedMember === wm.id ? null : wm.id)}
                    className="w-full flex items-center gap-3 p-4 text-left btn-press"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: '#3A3A3A', color: '#E8A317' }}
                    >
                      {wm.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-cream">{wm.name}</p>
                      <p className="text-xs text-muted">{wm.watched_count} watched</p>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#8A8A7A"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: expandedMember === wm.id ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {expandedMember === wm.id && wm.items && (
                    <div className="px-4 pb-4">
                      <div className="flex flex-col gap-2">
                        {wm.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 py-2 border-t border-smoke">
                            <div className="w-8 h-12 flex-shrink-0 rounded overflow-hidden bg-smoke">
                              {item.poster_url ? (
                                <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-muted">?</div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-cream truncate">{item.title}</p>
                              <p className="text-xs text-muted">
                                {item.year}{item.tmdb_rating ? ` · ${item.tmdb_rating}/10` : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        recommendations={allRecs}
        onWatch={handleWatch}
        onUnwatch={handleUnwatch}
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
