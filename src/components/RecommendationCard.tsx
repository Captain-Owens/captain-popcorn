'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Recommendation } from '@/lib/types';
import { PLATFORMS } from '@/lib/constants';

interface RecommendationCardProps {
  rec: Recommendation;
  onWatch: (id: string) => void;
  onUnwatch?: (id: string) => void;
  onLike?: (id: string) => void;
  onUnlike?: (id: string) => void;
  onDelete?: (id: string) => void;
  currentMemberId?: string;
  showWatched?: boolean;
}

export default function RecommendationCard({
  rec,
  onWatch,
  onUnwatch,
  onLike,
  onUnlike,
  onDelete,
  currentMemberId,
  showWatched = false,
}: RecommendationCardProps) {
  const platform = PLATFORMS.find((p) => p.slug === rec.platform);
  const [showCelebration, setShowCelebration] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isOwner = currentMemberId && rec.member_id === currentMemberId;

  const isNew = (() => {
    const created = new Date(rec.created_at);
    const now = new Date();
    return (now.getTime() - created.getTime()) < 3 * 24 * 60 * 60 * 1000;
  })();

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
      className="relative rounded-card overflow-hidden"
      style={{
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      }}
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

      {/* Delete confirmation overlay */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-rich-black/90 rounded-card"
          >
            <div className="text-center p-4">
              <p className="text-cream font-medium mb-4">Delete this pick?</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-5 py-2.5 rounded-btn text-sm font-medium bg-smoke text-cream btn-press min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onDelete?.(rec.id)}
                  className="px-5 py-2.5 rounded-btn text-sm font-medium bg-deep-red text-cream btn-press min-h-[44px]"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3 p-3 bg-charcoal">
        {/* Poster - larger with gradient overlay */}
        <div className="w-24 h-36 flex-shrink-0 rounded-btn overflow-hidden bg-smoke relative">
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
          {/* New badge */}
          {isNew && (
            <div
              className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: '#E8A317', color: '#1A1A1A' }}
            >
              NEW
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0 py-0.5">
          <h3 className="font-bold text-cream text-base leading-tight truncate">
            {rec.title}
          </h3>

          <div className="flex items-center gap-2 text-xs text-muted mt-1">
            {rec.year && <span>{rec.year}</span>}
            {rec.genre && (
              <>
                <span style={{ opacity: 0.4 }}>·</span>
                <span className="truncate">{rec.genre}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
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
            {(rec as any).like_count > 0 && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: 'rgba(139,26,26,0.2)', color: '#FF6B6B' }}
              >
                👍 {(rec as any).like_count}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-muted mt-1.5">
            <span className="font-medium text-cream">{rec.recommender_name}</span>
            {rec.comment && (
              <>
                <span style={{ opacity: 0.3 }}>·</span>
                <span className="italic truncate">&ldquo;{rec.comment}&rdquo;</span>
              </>
            )}
          </div>

          {/* Actions - 44px touch targets */}
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

            {onLike && (
              <button
                onClick={() => (rec as any).is_liked ? onUnlike?.(rec.id) : onLike(rec.id)}
                className="flex items-center justify-center btn-press rounded-btn"
                style={{
                  minWidth: 44,
                  minHeight: 44,
                  backgroundColor: (rec as any).is_liked ? 'rgba(232,163,23,0.15)' : 'transparent',
                }}
                aria-label={(((rec as any).is_liked ? 'Unlike' : 'Like') + ' ' + rec.title)}
              >
                <span style={{ fontSize: 18, filter: (rec as any).is_liked ? 'none' : 'grayscale(1) opacity(0.5)' }}>
                  👍
                </span>
              </button>
            )}

            {isOwner && onDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center justify-center btn-press rounded-btn ml-auto"
                style={{ minWidth: 44, minHeight: 44 }}
                aria-label="Delete recommendation"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A8A7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
