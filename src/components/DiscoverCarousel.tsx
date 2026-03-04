'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';

interface DiscoverItem {
  id: number;
  title: string;
  poster_url: string | null;
  year: number | null;
  genre: string | null;
  tmdb_rating: number | null;
  type: 'movie' | 'show';
  reason?: string;
}

interface DiscoverCarouselProps {
  items: DiscoverItem[];
  loading: boolean;
  onRefresh: () => void;
}

export default function DiscoverCarousel({ items, loading, onRefresh }: DiscoverCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardWidth = 280;

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
  }, [currentIndex, x]);

  if (loading) {
    return (
      <div className="bg-charcoal rounded-card p-4 border border-smoke">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted font-medium">Discover</span>
        </div>
        <div className="skeleton h-[180px] w-full rounded-btn" />
        <div className="skeleton h-4 w-3/4 mt-3" />
        <div className="skeleton h-3 w-1/2 mt-2" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-charcoal rounded-card p-6 border border-smoke text-center">
        <div className="text-3xl mb-2">🔭</div>
        <p className="text-sm text-muted mb-3">Add more picks to unlock AI-powered suggestions</p>
        <button
          onClick={onRefresh}
          className="text-xs text-warm-gold font-medium btn-press"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-charcoal rounded-card p-4 border border-smoke overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted font-medium">Discover</span>
        <div className="flex items-center gap-2">
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
          <button
            onClick={onRefresh}
            className="text-muted hover:text-cream btn-press p-1"
            aria-label="Refresh suggestions"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
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
              className="flex-shrink-0"
              style={{ width: cardWidth }}
            >
              <div className="relative rounded-btn overflow-hidden bg-smoke" style={{ height: 180 }}>
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
                      <span className="text-warm-gold font-medium">{item.tmdb_rating}/10</span>
                    )}
                    <span className="text-white/50 capitalize">{item.type}</span>
                  </div>
                </div>
              </div>
              {item.reason && (
                <p className="text-xs text-muted mt-2 line-clamp-2 italic">{item.reason}</p>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
