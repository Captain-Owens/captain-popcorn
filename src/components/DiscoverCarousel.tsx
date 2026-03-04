'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, animate, PanInfo, AnimatePresence } from 'framer-motion';

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

interface DiscoverCarouselProps {
  items: DiscoverItem[];
  loading: boolean;
}

export default function DiscoverCarousel({ items, loading }: DiscoverCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<DiscoverItem | null>(null);
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(280);

  // Measure container to set card width dynamically
  useEffect(() => {
    if (containerRef.current) {
      const w = containerRef.current.offsetWidth - 32; // padding
      setCardWidth(Math.min(w, 320));
    }
  }, []);

  function handleDragEnd(_: any, info: PanInfo) {
    const threshold = cardWidth / 4;
    const velocity = info.velocity.x;

    if (info.offset.x < -threshold || velocity < -500) {
      if (currentIndex < items.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    } else if (info.offset.x > threshold || velocity > 500) {
      if (currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    }
  }

  useEffect(() => {
    animate(x, -currentIndex * (cardWidth + 12), {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    });
  }, [currentIndex, x, cardWidth]);

  if (loading) {
    return (
      <div className="bg-charcoal rounded-card p-4 border border-smoke">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-cream">Discover</span>
        </div>
        <div className="skeleton h-[200px] w-full rounded-btn" />
        <div className="skeleton h-4 w-3/4 mt-3" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-charcoal rounded-card p-6 border border-smoke text-center">
        <div className="text-3xl mb-2">🔭</div>
        <p className="text-sm text-muted">Add more picks to unlock AI-powered suggestions</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-charcoal rounded-card p-4 border border-smoke overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-cream">Discover</span>
          <div className="flex gap-1">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className="btn-press"
                aria-label={`Go to suggestion ${i + 1}`}
              >
                <div
                  className="rounded-full transition-all duration-200"
                  style={{
                    width: i === currentIndex ? 16 : 6,
                    height: 6,
                    backgroundColor: i === currentIndex ? '#E8A317' : '#3A3A3A',
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        <div ref={containerRef} className="overflow-hidden" style={{ touchAction: 'pan-y' }}>
          <motion.div
            className="flex gap-3"
            style={{ x }}
            drag="x"
            dragConstraints={{
              left: -(items.length - 1) * (cardWidth + 12),
              right: 0,
            }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
          >
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                className="flex-shrink-0 cursor-pointer"
                style={{ width: cardWidth }}
                onClick={() => setSelectedItem(item)}
                whileTap={{ scale: 0.97 }}
              >
                <div className="relative rounded-btn overflow-hidden bg-smoke" style={{ height: 200 }}>
                  {item.poster_url ? (
                    <img
                      src={item.poster_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading={i === 0 ? 'eager' : 'lazy'}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🍿</div>
                  )}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(to top, rgba(28,20,16,0.95) 0%, rgba(28,20,16,0.4) 40%, transparent 70%)',
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-sm font-bold text-white truncate">{item.title}</p>
                    <div className="flex items-center gap-2 text-xs mt-1">
                      {item.year && <span className="text-white/70">{item.year}</span>}
                      {item.tmdb_rating && (
                        <span className="text-warm-gold font-medium">★ {item.tmdb_rating}</span>
                      )}
                      <span className="text-white/50 capitalize">{item.type}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Detail popup */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-24"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-[440px] rounded-card overflow-hidden"
              style={{ backgroundColor: '#2A2A2A', boxShadow: '0 -4px 30px rgba(0,0,0,0.5)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Poster header */}
              <div className="relative h-[220px] overflow-hidden">
                {selectedItem.poster_url ? (
                  <img
                    src={selectedItem.poster_url}
                    alt={selectedItem.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl bg-smoke">🍿</div>
                )}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to top, #2A2A2A 0%, rgba(42,42,42,0.6) 40%, transparent 100%)',
                  }}
                />
                {/* Close button */}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full btn-press"
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Info */}
              <div className="px-5 pb-5 -mt-10 relative">
                <h3 className="text-xl font-bold text-white mb-1">{selectedItem.title}</h3>
                <div className="flex items-center gap-3 text-sm mb-3 flex-wrap">
                  {selectedItem.year && <span className="text-white/60">{selectedItem.year}</span>}
                  {selectedItem.tmdb_rating && (
                    <span className="text-warm-gold font-medium">★ {selectedItem.tmdb_rating}/10</span>
                  )}
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                    style={{ backgroundColor: 'rgba(232,163,23,0.15)', color: '#E8A317' }}
                  >
                    {selectedItem.type}
                  </span>
                  {selectedItem.genre && (
                    <span className="text-white/40 text-xs">{selectedItem.genre}</span>
                  )}
                </div>
                {selectedItem.overview && (
                  <p className="text-sm text-white/70 leading-relaxed line-clamp-4">
                    {selectedItem.overview}
                  </p>
                )}
                {!selectedItem.overview && selectedItem.genre && (
                  <p className="text-sm text-white/50 italic">
                    A {selectedItem.genre.split(',')[0].toLowerCase()} {selectedItem.type} your crew might love.
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
