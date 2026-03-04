'use client';

import { motion } from 'framer-motion';
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
  const commentCount = rec.comment_count || 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3 p-4 bg-charcoal rounded-card"
    >
      {/* Poster */}
      <div className="w-20 h-28 flex-shrink-0 rounded-btn overflow-hidden bg-smoke">
        {rec.poster_url ? (
          <img
            src={rec.poster_url}
            alt={rec.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-xs">
            No poster
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
              <span>·</span>
              <span className="truncate">{rec.genre}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          {rec.tmdb_rating && (
            <span className="text-warm-gold font-medium">
              {rec.tmdb_rating}/10
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
          <span className="font-medium text-cream">
            {rec.recommender_name}
          </span>
          {rec.rating && (
            <span className="text-warm-gold">
              {'★'.repeat(rec.rating)}
              {'☆'.repeat(5 - rec.rating)}
            </span>
          )}
        </div>

        {rec.comment && (
          <p className="text-xs text-muted italic mt-0.5 line-clamp-2">
            &ldquo;{rec.comment}&rdquo;
          </p>
        )}

        <div className="flex items-center gap-2 mt-auto pt-2">
          {rec.is_watched || showWatched ? (
            <button
              onClick={() => onUnwatch?.(rec.id)}
              className="flex items-center gap-1 px-3 py-2 rounded-btn text-xs font-medium btn-press min-h-[36px] bg-smoke text-muted"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Watched
            </button>
          ) : (
            <button
              onClick={() => onWatch(rec.id)}
              className="flex items-center gap-1 px-3 py-2 rounded-btn text-xs font-medium btn-press min-h-[36px] bg-deep-red text-cream"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Seen it?
            </button>
          )}

          {/* Comment button */}
          {onComment && (
            <button
              onClick={() => onComment(rec.id, rec.title)}
              className="flex items-center gap-1 px-3 py-2 rounded-btn text-xs font-medium btn-press min-h-[36px] bg-smoke text-muted"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {commentCount > 0 ? commentCount : ''}
            </button>
          )}

          {/* Watch count + comment indicator */}
          <div className="flex items-center gap-2 ml-auto text-xs text-muted">
            {commentCount > 0 && !onComment && (
              <span title={commentCount + ' comments'}>💬 {commentCount}</span>
            )}
            {rec.watch_count !== undefined && rec.watch_count > 0 && (
              <span>{rec.watch_count} watched</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
