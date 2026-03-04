'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Recommendation } from '@/lib/types';
import { PLATFORMS } from '@/lib/constants';

interface RecommendationCardProps {
  rec: Recommendation;
  onWatch: (id: string) => void;
  onUnwatch?: (id: string) => void;
  onComment?: (recId: string, recTitle: string) => void;
  showWatched?: boolean;
}

export default function RecommendationCard({
  rec,
  onWatch,
  onUnwatch,
  onComment,
  showWatched = false,
}: RecommendationCardProps) {
  const platform = PLATFORMS.find((p) => p.slug === rec.platform);
  const [showCelebration, setShowCelebration] = useState(false);

  function handleWatch() {
    setShowCelebration(true);
    setTimeout(() => {
      onWatch(rec.id);
    }, 800);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
      className="relative flex gap-3 p-3 bg-charcoal rounded-card"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
    >
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-rich-black/80 rounded-card"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
              transition={{ type: 'spring', damping: 10, stiffness: 200 }}
              className="text-center"
            >
              <motion.div
                className="text-5xl mb-2"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                🍿
              </motion.div>
              <p className="text-warm-gold font-bold">Nice pick!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Poster */}
      <div className="w-24 h-36 flex-shrink-0 rounded-btn overflow-hidden bg-smoke">
        {rec.poster_url ? (
          <img
            src={rec.poster_url}
            alt={rec.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-lg">
            🎬
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <h3 className="font-bold text-cream text-base leading-tight truncate">
          {rec.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-muted">
          {rec.year && <span>{rec.year}</span>}
          {rec.genre && (
            <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span className="truncate">{rec.genre}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs mt-0.5 flex-wrap">
          {rec.tmdb_rating && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: 'rgba(232,163,23,0.15)', color: '#E8A317' }}
            >
              ★ {rec.tmdb_rating}
            </span>
          )}
          {platform && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: platform.color + '22',
                color: platform.color,
              }}
            >
              {platform.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-muted mt-0.5">
          <span className="font-medium text-cream">{rec.recommender_name}</span>
          {rec.comment && (
            <>
              <span style={{ opacity: 0.3 }}>·</span>
              <span className="italic truncate">&ldquo;{rec.comment}&rdquo;</span>
            </>
          )}
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2 mt-auto pt-2">
          {rec.is_watched || showWatched ? (
            <button
              onClick={() => onUnwatch?.(rec.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-btn text-xs font-medium btn-press bg-smoke text-muted"
              style={{ minHeight: 44 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Watched
            </button>
          ) : (
            <button
              onClick={handleWatch}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-btn text-xs font-bold btn-press bg-deep-red text-cream"
              style={{ minHeight: 44 }}
            >
              Seen it?
            </button>
          )}

          {onComment && (
            <button
              onClick={() => onComment(rec.id, rec.title)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-btn text-xs font-medium btn-press bg-smoke text-muted"
              style={{ minHeight: 44 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Comment
            </button>
          )}

          {rec.watch_count !== undefined && rec.watch_count > 0 && (
            <span className="text-xs text-muted ml-auto">
              {rec.watch_count} watched
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
