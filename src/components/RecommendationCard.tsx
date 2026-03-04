'use client';

import { motion } from 'framer-motion';
import { Recommendation } from '@/lib/types';
import { PLATFORMS } from '@/lib/constants';

interface RecommendationCardProps {
  rec: Recommendation;
  onWatch: (id: string) => void;
  onUnwatch?: (id: string) => void;
  onLike?: (id: string) => void;
  onUnlike?: (id: string) => void;
  currentMemberId?: string;
  showWatched?: boolean;
}

export default function RecommendationCard({
  rec,
  onWatch,
  onUnwatch,
  onLike,
  onUnlike,
  currentMemberId,
  showWatched = false,
}: RecommendationCardProps) {
  const platform = PLATFORMS.find((p) => p.slug === rec.platform);
  const isLiked = rec.is_liked || false;
  const likeCount = rec.like_count || 0;

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
              <span>&middot;</span>
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

        <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
          <span className="font-medium text-cream">
            {rec.recommender_name}
          </span>
        </div>

        {rec.comment && (
          <p className="text-xs text-muted italic mt-0.5 line-clamp-2">
            &ldquo;{rec.comment}&rdquo;
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex items-center gap-2">
            {rec.is_watched || showWatched ? (
              <button
                onClick={() => onUnwatch?.(rec.id)}
                className="px-3 py-2 rounded-btn text-xs font-medium btn-press min-h-[36px] bg-smoke text-muted"
              >
                Watched
              </button>
            ) : (
              <button
                onClick={() => onWatch(rec.id)}
                className="px-3 py-2 rounded-btn text-xs font-medium btn-press min-h-[36px] bg-deep-red text-cream"
              >
                Seen it?
              </button>
            )}

            {/* Thumbs up button */}
            <button
              onClick={() => {
                if (isLiked) {
                  onUnlike?.(rec.id);
                } else {
                  onLike?.(rec.id);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-btn text-xs font-medium btn-press min-h-[36px] transition-colors ${
                isLiked
                  ? 'bg-warm-gold/20 text-warm-gold'
                  : 'bg-smoke text-muted hover:text-cream'
              }`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill={isLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>
          </div>

          {rec.watch_count !== undefined && rec.watch_count > 0 && (
            <span className="text-xs text-muted">
              {rec.watch_count} watched
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
