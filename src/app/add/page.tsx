'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TMDBParsed, Platform } from '@/lib/types';
import { STORAGE_KEY_MEMBER } from '@/lib/constants';
import BottomNav from '@/components/BottomNav';
import PlatformPicker from '@/components/PlatformPicker';
import RatingInput from '@/components/RatingInput';

export default function AddPage() {
  const router = useRouter();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TMDBParsed[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<TMDBParsed | null>(null);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const [manualTitle, setManualTitle] = useState('');
  const [duplicateTitle, setDuplicateTitle] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem(STORAGE_KEY_MEMBER);
    if (!id) {
      router.replace('/pick');
      return;
    }
    setMemberId(id);
  }, [router]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (Array.isArray(data)) setResults(data);
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function handleSubmit() {
    if (!memberId) return;
    const title = selected?.title || manualTitle.trim();
    if (!title) return;

    setSubmitting(true);

    // Check for duplicates
    try {
      const checkRes = await fetch('/api/recommendations?limit=200');
      const existing = await checkRes.json();
      if (Array.isArray(existing)) {
        const tmdbMatch = selected?.tmdb_id && existing.find(
          (r: any) => r.tmdb_id === selected.tmdb_id
        );
        const titleMatch = !tmdbMatch && existing.find(
          (r: any) => r.title.toLowerCase() === title.toLowerCase()
        );
        if (tmdbMatch || titleMatch) {
          setDuplicateTitle(title);
          setSubmitting(false);
          return;
        }
      }
    } catch {}

    const body = {
      member_id: memberId,
      title,
      type: selected?.type || 'movie',
      tmdb_id: selected?.tmdb_id || null,
      poster_url: selected?.poster_url || null,
      year: selected?.year || null,
      genre: selected?.genre || null,
      tmdb_rating: selected?.tmdb_rating || null,
      platform,
      rating,
      comment: comment.trim() || null,
    };

    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/home'), 1000);
      }
    } catch {}

    setSubmitting(false);
  }

  const hasTitle = selected || manualTitle.trim().length > 0;

  return (
    <div className="px-4 py-6 pb-24 page-enter">
      <h1 className="text-2xl font-bold mb-6">Add a pick</h1>

      {/* Success state */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-rich-black/90"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">🍿</div>
              <p className="text-xl font-bold text-warm-gold">Added!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Duplicate popup */}
      <AnimatePresence>
        {duplicateTitle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-rich-black/90 px-6"
            onClick={() => setDuplicateTitle(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-charcoal rounded-card p-6 text-center max-w-[320px] w-full"
              style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="text-5xl mb-4">🤝</div>
              <p className="text-lg font-bold text-cream mb-2">Great minds think alike!</p>
              <p className="text-sm text-muted mb-4">
                <span className="text-warm-gold font-medium">{duplicateTitle}</span> has already been added by someone in the crew.
              </p>
              <button
                onClick={() => {
                  setDuplicateTitle(null);
                  setSelected(null);
                  setQuery('');
                  setManualTitle('');
                }}
                className="px-6 py-3 bg-warm-gold text-rich-black rounded-btn font-bold btn-press"
                style={{ minHeight: 44 }}
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title search */}
      {!selected ? (
        <div className="mb-4">
          <label className="block text-sm text-muted mb-2">
            What did you watch?
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setManualTitle(e.target.value);
            }}
            placeholder="Search any movie or show..."
            autoFocus
          />

          {(results.length > 0 || searching) && query.length >= 2 && (
            <div className="mt-2 bg-charcoal rounded-card border border-smoke overflow-hidden">
              {searching && (
                <div className="p-3 text-sm text-muted">Searching...</div>
              )}
              {results.map((r) => (
                <button
                  key={`${r.tmdb_id}-${r.type}`}
                  onClick={() => {
                    setSelected(r);
                    setQuery('');
                    setResults([]);
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-smoke transition-colors text-left btn-press"
                >
                  <div className="w-10 h-14 flex-shrink-0 rounded overflow-hidden bg-smoke">
                    {r.poster_url ? (
                      <img src={r.poster_url} alt={r.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted">?</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-cream truncate">{r.title}</p>
                    <p className="text-xs text-muted">{r.year} · {r.genre}</p>
                  </div>
                  <span className="text-xs text-muted flex-shrink-0 px-2 py-0.5 bg-smoke rounded-full">
                    {r.type === 'movie' ? 'Movie' : 'Show'}
                  </span>
                </button>
              ))}
              {!searching && results.length === 0 && query.length >= 2 && (
                <div className="p-3 text-sm text-muted">No results. Add manually.</div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4 p-4 bg-charcoal rounded-card flex items-start gap-3">
          <div className="w-16 h-24 flex-shrink-0 rounded-btn overflow-hidden bg-smoke">
            {selected.poster_url ? (
              <img src={selected.poster_url} alt={selected.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted">?</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-cream">{selected.title}</h3>
            <p className="text-xs text-muted">
              {selected.year} · {selected.genre} · {selected.type === 'movie' ? 'Movie' : 'Show'}
            </p>
            {selected.tmdb_rating && (
              <p className="text-xs text-warm-gold mt-1">{selected.tmdb_rating}/10 TMDB</p>
            )}
          </div>
          <button onClick={() => setSelected(null)} className="text-muted hover:text-cream btn-press p-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm text-muted mb-2">Where to watch (optional)</label>
        <PlatformPicker selected={platform} onSelect={setPlatform} />
      </div>

      <div className="mb-4">
        <label className="block text-sm text-muted mb-2">Your rating (optional)</label>
        <RatingInput value={rating} onChange={setRating} />
      </div>

      <div className="mb-6">
        <label className="block text-sm text-muted mb-2">One-liner (optional)</label>
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Slow start but worth it..."
          maxLength={280}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!hasTitle || submitting}
        className="w-full py-4 bg-warm-gold text-rich-black rounded-btn font-bold text-lg btn-press min-h-[56px] disabled:opacity-50"
      >
        {submitting ? 'Adding...' : 'Add to the list'}
      </button>

      <BottomNav />
    </div>
  );
}
