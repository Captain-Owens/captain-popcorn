'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Recommendation, Member } from '@/lib/types';
import { STORAGE_KEY_MEMBER } from '@/lib/constants';
import BottomNav from '@/components/BottomNav';
import RecommendationCard from '@/components/RecommendationCard';
import SkeletonCard from '@/components/SkeletonCard';
import SearchOverlay from '@/components/SearchOverlay';
import CommentsSheet from '@/components/CommentsSheet';

interface WatchedMember {
  member_id: string;
  member_name: string;
  count: number;
  items: {
    id: string;
    title: string;
    poster_url: string | null;
    type: string;
    year: number | null;
    tmdb_rating: number | null;
    watched_at: string;
  }[];
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

  // Browse filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'show'>('all');
  const [memberFilter, setMemberFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'top_rated' | 'most_watched'>('newest');

  // Watched list
  const [watchedList, setWatchedList] = useState<WatchedMember[]>([]);
  const [watchedLoading, setWatchedLoading] = useState(false);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  // Comments
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentRecId, setCommentRecId] = useState('');
  const [commentRecTitle, setCommentRecTitle] = useState('');

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
      fetch('/api/recommendations?limit=100'),
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

  async function fetchWatched() {
    setWatchedLoading(true);
    try {
      const res = await fetch('/api/watched/list');
      const data = await res.json();
      if (Array.isArray(data)) setWatchedList(data);
    } catch {}
    setWatchedLoading(false);
  }

  useEffect(() => {
    if (activeTab === 'watched') {
      fetchWatched();
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
    setCommentRecId(recId);
    setCommentRecTitle(recTitle);
    setCommentsOpen(true);
  }

  return (
    <div className="px-4 py-6 pb-24 page-enter">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Browse</h1>
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-charcoal rounded-btn text-sm text-muted btn-press"
          style={{ minHeight: 44 }}
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
          className="px-4 py-2.5 rounded-btn text-sm font-medium btn-press transition-colors"
          style={{
            minHeight: 44,
            backgroundColor: activeTab === 'browse' ? '#E8A317' : '#2A2A2A',
            color: activeTab === 'browse' ? '#1A1A1A' : '#8A8A7A',
          }}
        >
          Browse
        </button>
        <button
          onClick={() => setActiveTab('watched')}
          className="px-4 py-2.5 rounded-btn text-sm font-medium btn-press transition-colors"
          style={{
            minHeight: 44,
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
                className="px-3 py-2 rounded-btn text-xs font-medium btn-press transition-colors"
                style={{
                  minHeight: 44,
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
              className="flex-1 bg-charcoal border border-smoke rounded-btn px-3 py-2 text-sm text-cream"
              style={{ minHeight: 44 }}
            >
              <option value="">Everyone</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-charcoal border border-smoke rounded-btn px-3 py-2 text-sm text-cream"
              style={{ minHeight: 44 }}
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
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-cream font-medium text-lg mb-1">Nothing matches</p>
              <p className="text-muted text-sm">Try different filters or add a new pick.</p>
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
        <>
          {watchedLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 w-full rounded-card" />
              ))}
            </div>
          ) : watchedList.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">👀</div>
              <p className="text-cream font-medium text-lg mb-1">No one has watched anything yet</p>
              <p className="text-muted text-sm">Start marking titles as watched!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {watchedList.map((wm) => (
                <div key={wm.member_id}>
                  <button
                    onClick={() => setExpandedMember(
                      expandedMember === wm.member_id ? null : wm.member_id
                    )}
                    className="w-full flex items-center justify-between p-4 bg-charcoal rounded-card btn-press"
                    style={{ minHeight: 56, boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: '#3A3A3A', color: '#E8A317' }}
                      >
                        {wm.member_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-cream">{wm.member_name}</p>
                        <p className="text-xs text-muted">{wm.count} watched</p>
                      </div>
                    </div>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="#8A8A7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{
                        transform: expandedMember === wm.member_id ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 200ms ease',
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {expandedMember === wm.member_id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-2 pt-2 pl-4">
                          {wm.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 p-2 rounded-btn bg-smoke/50"
                            >
                              <div className="w-10 h-14 flex-shrink-0 rounded overflow-hidden bg-smoke">
                                {item.poster_url ? (
                                  <img
                                    src={item.poster_url}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs text-muted">🎬</div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-cream truncate">{item.title}</p>
                                <div className="flex items-center gap-2 text-xs text-muted">
                                  {item.year && <span>{item.year}</span>}
                                  {item.tmdb_rating && (
                                    <span className="text-warm-gold">★ {item.tmdb_rating}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </>
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
        recommendationId={commentRecId}
        recommendationTitle={commentRecTitle}
        memberId={memberId || ''}
      />

      <BottomNav />
    </div>
  );
}
