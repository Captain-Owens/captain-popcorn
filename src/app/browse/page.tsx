'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Recommendation, Member } from '@/lib/types';
import { STORAGE_KEY_MEMBER } from '@/lib/constants';
import BottomNav from '@/components/BottomNav';
import RecommendationCard from '@/components/RecommendationCard';
import SkeletonCard from '@/components/SkeletonCard';
import SearchOverlay from '@/components/SearchOverlay';
import CommentsSheet from '@/components/CommentsSheet';

const GENRES = [
  { label: 'All', match: null },
  { label: 'Action', match: ['Action'] },
  { label: 'Comedy', match: ['Comedy'] },
  { label: 'Drama', match: ['Drama'] },
  { label: 'Sci-Fi', match: ['Sci-Fi', 'Science Fiction'] },
  { label: 'Adventure', match: ['Adventure'] },
  { label: 'Western', match: ['Western'] },
  { label: 'Rom-Com', match: ['Romance'] },
  { label: 'Animation', match: ['Animation'] },
  { label: 'Documentary', match: ['Documentary'] },
  { label: 'True Crime', match: ['Crime'] },
  { label: 'Kid Friendly', match: ['Family', 'Kids', 'Animation'] },
] as const;

interface WatchedMember {
  id: string;
  name: string;
  watched_count: number;
  items?: { title: string; poster_url: string | null; year: number | null; tmdb_rating: number | null }[];
}

interface PersonResult {
  id: number;
  name: string;
  known_for: string;
  profile_url: string | null;
  credit_count: number;
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
  const [activeTab, setActiveTab] = useState<'browse' | 'watched' | 'saved'>('browse');
  const [watchedMembers, setWatchedMembers] = useState<WatchedMember[]>([]);
  const [watchedLoading, setWatchedLoading] = useState(false);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [savedRecs, setSavedRecs] = useState<Recommendation[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);

  // Saved IDs for bookmark state
  const [isAdmin, setIsAdmin] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'show'>('all');
  const [memberFilter, setMemberFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'top_rated' | 'most_watched'>('newest');
  const [genreFilter, setGenreFilter] = useState<string>('All');

  // Actor/Director search
  const [personQuery, setPersonQuery] = useState('');
  const [personResults, setPersonResults] = useState<PersonResult[]>([]);
  const [personSearching, setPersonSearching] = useState(false);
  const [matchingTmdbIds, setMatchingTmdbIds] = useState<number[] | null>(null);
  const [activePersonName, setActivePersonName] = useState<string | null>(null);
  const personDebounce = useRef<NodeJS.Timeout>();

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

    try {
      const [recsRes, membersRes, allRes, savedRes] = await Promise.all([
        fetch(`/api/recommendations?${params.toString()}`),
        fetch('/api/members'),
        fetch('/api/recommendations?limit=200'),
        fetch(`/api/saved?member_id=${memberId}`),
      ]);

      const recsData = await recsRes.json();
      const membersData = await membersRes.json();
      const allData = await allRes.json();
      const savedData = await savedRes.json();

      if (Array.isArray(recsData)) setRecs(recsData);
      if (Array.isArray(membersData)) setMembers(membersData);
      if (Array.isArray(allData)) setAllRecs(allData);
      if (Array.isArray(savedData)) {
        setSavedIds(new Set(savedData.map((s: any) => s.recommendation_id)));
      }
    } catch {}

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

  // Fetch saved list
  useEffect(() => {
    if (activeTab === 'saved' && memberId) {
      setSavedLoading(true);
      fetch(`/api/saved/list?member_id=${memberId}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setSavedRecs(data);
          setSavedLoading(false);
        })
        .catch(() => setSavedLoading(false));
    }
  }, [activeTab, memberId]);

  // Person search debounce
  useEffect(() => {
    if (personQuery.length < 2) {
      setPersonResults([]);
      return;
    }
    if (personDebounce.current) clearTimeout(personDebounce.current);
    personDebounce.current = setTimeout(async () => {
      setPersonSearching(true);
      try {
        const res = await fetch(`/api/search/person?q=${encodeURIComponent(personQuery)}`);
        const data = await res.json();
        if (data.people) setPersonResults(data.people);
        if (data.matching_tmdb_ids) setMatchingTmdbIds(data.matching_tmdb_ids);
      } catch {}
      setPersonSearching(false);
    }, 400);
    return () => { if (personDebounce.current) clearTimeout(personDebounce.current); };
  }, [personQuery]);

  async function handleWatch(recId: string) {
    if (!memberId) return;
    setRecs((prev) => prev.filter((r) => r.id !== recId));
    setSavedRecs((prev) => prev.filter((r) => r.id !== recId));
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

  async function handleSave(recId: string) {
    if (!memberId) return;
    setSavedIds((prev) => new Set(prev).add(recId));
    await fetch('/api/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId, recommendation_id: recId }),
    });
  }

  async function handleUnsave(recId: string) {
    if (!memberId) return;
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.delete(recId);
      return next;
    });
    setSavedRecs((prev) => prev.filter((r) => r.id !== recId));
    await fetch('/api/saved', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId, recommendation_id: recId }),
    });
  }


  async function handleDelete(recId: string) {
    await fetch('/api/recommendations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: recId }),
    });
    fetchData(false);
  }

  function handleOpenComments(recId: string, recTitle: string) {
    setCommentsRecId(recId);
    setCommentsRecTitle(recTitle);
    setCommentsOpen(true);
  }

  function selectPerson(person: PersonResult) {
    setActivePersonName(person.name);
    setPersonQuery('');
    setPersonResults([]);
  }

  function clearPersonFilter() {
    setActivePersonName(null);
    setMatchingTmdbIds(null);
    setPersonQuery('');
    setPersonResults([]);
  }

  // Apply genre + person filters
  const filteredRecs = recs.filter((rec) => {
    if (genreFilter !== 'All') {
      const genreDef = GENRES.find((g) => g.label === genreFilter);
      if (genreDef && genreDef.match) {
        const recGenre = (rec.genre || '').toLowerCase();
        const matches = genreDef.match.some((g) => recGenre.includes(g.toLowerCase()));
        if (!matches) return false;
      }
    }
    if (matchingTmdbIds && activePersonName) {
      if (!rec.tmdb_id || !matchingTmdbIds.includes(rec.tmdb_id)) return false;
    }
    return true;
  });

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

      {/* Browse / Watched / Saved tabs */}
      <div className="flex gap-2 mb-4">
        {(['browse', 'watched', 'saved'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-btn text-sm font-medium btn-press min-h-[40px]"
            style={{
              backgroundColor: activeTab === tab ? '#E8A317' : '#2A2A2A',
              color: activeTab === tab ? '#1A1A1A' : '#8A8A7A',
            }}
          >
            {tab === 'browse' ? 'Browse' : tab === 'watched' ? 'Watched' : 'Saved'}
          </button>
        ))}
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

          {/* Genre filter */}
          <div
            className="flex gap-2 mb-3 overflow-x-auto pb-1"
            style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {GENRES.map((g) => (
              <button
                key={g.label}
                onClick={() => setGenreFilter(g.label)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium btn-press transition-colors"
                style={{
                  backgroundColor: genreFilter === g.label ? '#E8A317' : '#2A2A2A',
                  color: genreFilter === g.label ? '#1A1A1A' : '#8A8A7A',
                  border: genreFilter === g.label ? '1px solid #E8A317' : '1px solid #3A3A3A',
                }}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Member filter + Sort */}
          <div className="flex gap-2 mb-3">
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

          {/* Actor/Director search */}
          <div className="mb-4 relative">
            {activePersonName ? (
              <div className="flex items-center gap-2 bg-charcoal border border-warm-gold rounded-btn px-3 py-2 min-h-[40px]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8A317" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="text-sm text-cream flex-1">{activePersonName}</span>
                <button onClick={clearPersonFilter} className="text-muted hover:text-cream btn-press p-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A8A7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    type="text"
                    value={personQuery}
                    onChange={(e) => setPersonQuery(e.target.value)}
                    placeholder="Search by actor or director..."
                    className="w-full bg-charcoal border border-smoke rounded-btn pl-10 pr-3 py-2 text-sm text-cream min-h-[40px] placeholder-muted"
                    style={{ outline: 'none' }}
                  />
                  {personSearching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">...</span>}
                </div>
                {personResults.length > 0 && personQuery.length >= 2 && (
                  <div className="absolute left-0 right-0 mt-1 bg-charcoal border border-smoke rounded-card overflow-hidden z-20 shadow-lg">
                    {personResults.map((p) => {
                      const hasMatches = matchingTmdbIds && matchingTmdbIds.length > 0;
                      return (
                        <button
                          key={p.id}
                          onClick={() => selectPerson(p)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-smoke transition-colors text-left btn-press"
                        >
                          <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-smoke">
                            {p.profile_url ? (
                              <img src={p.profile_url} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-muted">{p.name.charAt(0)}</div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-cream truncate">{p.name}</p>
                            <p className="text-xs text-muted">{p.known_for}</p>
                          </div>
                          {hasMatches && <span className="text-xs text-warm-gold flex-shrink-0">In your list</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredRecs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted">{genreFilter !== 'All' || activePersonName ? 'No matches for these filters.' : 'Nothing here.'}</p>
              <p className="text-sm text-muted mt-1">Try different filters.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted">{filteredRecs.length} result{filteredRecs.length !== 1 ? 's' : ''}</p>
              <AnimatePresence>
                {filteredRecs.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    rec={rec}
                    onWatch={handleWatch}
                    onUnwatch={handleUnwatch}
                    onComment={handleOpenComments}
                    onSave={handleSave}
                  onDelete={handleDelete}
                  isAdmin={isAdmin}
                  onDelete={handleDelete}
                  isAdmin={isAdmin}
                  onDelete={handleDelete}
                  isAdmin={isAdmin}
                    onUnsave={handleUnsave}
                    isSaved={savedIds.has(rec.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      ) : activeTab === 'saved' ? (
        /* Saved tab */
        <div>
          {savedLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : savedRecs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🔖</div>
              <p className="text-muted">No saved titles yet.</p>
              <p className="text-sm text-muted mt-1">Tap the bookmark icon on any title to save it for later.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted">{savedRecs.length} saved</p>
              <AnimatePresence>
                {savedRecs.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    rec={rec}
                    onWatch={handleWatch}
                    onUnwatch={handleUnwatch}
                    onComment={handleOpenComments}
                    onSave={handleSave}
                    onUnsave={handleUnsave}
                    isSaved={true}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
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
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: '#3A3A3A', color: '#E8A317' }}>
                      {wm.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-cream">{wm.name || 'Unknown'}</p>
                      <p className="text-xs text-muted">{wm.watched_count || 0} watched</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A8A7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedMember === wm.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {expandedMember === wm.id && Array.isArray(wm.items) && wm.items.length > 0 && (
                    <div className="px-4 pb-4">
                      <div className="flex flex-col gap-2">
                        {wm.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 py-2 border-t border-smoke">
                            <div className="w-8 h-12 flex-shrink-0 rounded overflow-hidden bg-smoke">
                              {item.poster_url ? (
                                <img src={item.poster_url} alt={item.title || ''} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-muted">?</div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-cream truncate">{item.title || 'Unknown'}</p>
                              <p className="text-xs text-muted">{item.year || ''}{item.tmdb_rating ? ` · ${item.tmdb_rating}/10` : ''}</p>
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
