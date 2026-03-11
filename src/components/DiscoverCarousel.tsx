'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STORAGE_KEY_MEMBER } from '@/lib/constants';

interface DiscoverItem {
  id: number;
  title: string;
  poster_url: string | null;
  year: number | null;
  genre: string | null;
  tmdb_rating: number | null;
  overview: string | null;
  type: 'movie' | 'show';
}

interface DiscoverCarouselProps {
  items: DiscoverItem[];
  loading: boolean;
}

export default function DiscoverCarousel({ items, loading }: DiscoverCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<DiscoverItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const constraintsRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when detail popup is open (prevents iOS scroll passthrough)
  useEffect(() => {
    if (selectedItem) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
  }, [selectedItem]);

  const CARD_WIDTH = 240;
  const CARD_GAP = 12;

  function handleDragEnd(_: any, info: { offset: { x: number }; velocity: { x: number } }) {
    const swipe = info.offset.x + info.velocity.x * 0.5;
    if (swipe < -50 && currentIndex < items.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else if (swipe > 50 && currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }

  async function handleSaveItem(item: DiscoverItem) {
    const memberId = localStorage.getItem(STORAGE_KEY_MEMBER);
    if (!memberId || saving) return;

    setSaving(true);
    try {
      // 1. Add to crew recommendations
      const addRes = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId,
          title: item.title,
          type: item.type || 'movie',
          tmdb_id: item.id,
          poster_url: item.poster_url,
          year: item.year,
          genre: item.genre,
          tmdb_rating: item.tmdb_rating,
          platform: null,
          rating: null,
          comment: null,
        }),
      });

      if (addRes.ok) {
        const rec = await addRes.json();
        // 2. Save/bookmark it
        await fetch('/api/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            member_id: memberId,
            recommendation_id: rec.id,
          }),
        });
        setSavedIds((prev) => new Set(prev).add(item.id));
      }
    } catch {}
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 rounded-card overflow-hidden bg-charcoal"
            style={{ width: CARD_WIDTH, height: 160 }}
          >
            <div className="skeleton w-full h-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 bg-charcoal rounded-card">
        <p className="text-muted text-sm">No discoveries right now. Check back later!</p>
      </div>
    );
  }

  return (
    <>
      <div ref={constraintsRef} className="overflow-hidden">
        <motion.div
          className="flex"
          style={{ gap: CARD_GAP }}
          animate={{ x: -(currentIndex * (CARD_WIDTH + CARD_GAP)) }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          drag="x"
          dragConstraints={constraintsRef}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
        >
          {items.map((item, i) => (
            <motion.div
              key={item.id || i}
              className="flex-shrink-0 rounded-card overflow-hidden bg-charcoal border border-smoke cursor-pointer"
              style={{ width: CARD_WIDTH }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedItem(item)}
            >
              <div className="relative" style={{ height: 140 }}>
                {item.poster_url ? (
                  <img
                    src={item.poster_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-smoke text-muted text-2xl">
                    🍿
                  </div>
                )}
                {item.tmdb_rating && (
                  <div
                    className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#E8A317' }}
                  >
                    {item.tmdb_rating}/10
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-cream truncate">{item.title}</p>
                <p className="text-xs text-muted truncate">
                  {item.year}{item.genre ? ` · ${item.genre}` : ''}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Pagination dots */}
        {items.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {items.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === currentIndex ? 16 : 6,
                  height: 6,
                  backgroundColor: i === currentIndex ? '#E8A317' : '#3A3A3A',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail popup */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-rich-black/80"
            style={{ touchAction: 'none' }}
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedItem(null); }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-[480px] bg-charcoal rounded-t-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
              style={{ maxHeight: '85vh' }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-smoke" />
              </div>

              {/* Scrollable content */}
              <div className="px-5 overflow-y-auto flex-1" style={{ WebkitOverflowScrolling: 'touch' as any, overscrollBehavior: 'contain' }}>
                <div className="flex gap-4 mb-4">
                  <div className="w-28 h-40 flex-shrink-0 rounded-btn overflow-hidden bg-smoke">
                    {selectedItem.poster_url ? (
                      <img src={selectedItem.poster_url} alt={selectedItem.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🍿</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <h3 className="text-lg font-bold text-cream leading-tight mb-1">{selectedItem.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted mb-2">
                      {selectedItem.year && <span>{selectedItem.year}</span>}
                      {selectedItem.type && (
                        <>
                          <span>·</span>
                          <span>{selectedItem.type === 'movie' ? 'Movie' : 'Show'}</span>
                        </>
                      )}
                    </div>
                    {selectedItem.genre && <p className="text-xs text-muted mb-2">{selectedItem.genre}</p>}
                    {selectedItem.tmdb_rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-warm-gold font-bold text-sm">{selectedItem.tmdb_rating}/10</span>
                        <span className="text-xs text-muted">TMDB</span>
                      </div>
                    )}
                  </div>
                </div>
                {selectedItem.overview && (
                  <p className="text-sm text-muted leading-relaxed mb-4">{selectedItem.overview}</p>
                )}
              </div>

              {/* Buttons - PINNED at bottom, always visible */}
              <div className="flex gap-3 px-5 py-4 flex-shrink-0 border-t border-smoke" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
                {savedIds.has(selectedItem.id) ? (
                  <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-btn font-bold text-sm bg-smoke text-muted min-h-[48px]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#E8A317" stroke="#E8A317" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    Saved to your list
                  </div>
                ) : (
                  <button
                    onClick={() => handleSaveItem(selectedItem)}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-btn font-bold text-sm btn-press min-h-[48px]"
                    style={{
                      backgroundColor: saving ? '#3A3A3A' : '#E8A317',
                      color: saving ? '#8A8A7A' : '#1A1A1A',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    {saving ? 'Saving...' : 'Save to my list'}
                  </button>
                )}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-5 py-3 rounded-btn text-sm font-medium btn-press min-h-[48px] bg-smoke text-muted"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
