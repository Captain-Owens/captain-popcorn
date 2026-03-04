'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Recommendation } from '@/lib/types';
import RecommendationCard from './RecommendationCard';

interface SlotMachineProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  onWatch: (id: string) => void;
}

const SPIN_DURATION = 2;

export default function SlotMachine({ isOpen, onClose, memberId, onWatch }: SlotMachineProps) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Recommendation | null>(null);
  const [reelPosters, setReelPosters] = useState<string[]>([]);
  const [empty, setEmpty] = useState(false);
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const spin = useCallback(async () => {
    setSpinning(true);
    setResult(null);
    setEmpty(false);

    const res = await fetch(`/api/recommendations/random?exclude_watched_by=${memberId}`);
    const data = await res.json();

    if (!data) {
      setSpinning(false);
      setEmpty(true);
      return;
    }

    if (prefersReducedMotion) {
      setResult(data);
      setSpinning(false);
      return;
    }

    const fillerPosters: string[] = [];
    try {
      const feedRes = await fetch(`/api/recommendations?exclude_watched_by=${memberId}&limit=20`);
      const feedData = await feedRes.json();
      if (Array.isArray(feedData)) {
        feedData.forEach((r: Recommendation) => {
          if (r.poster_url && r.id !== data.id) fillerPosters.push(r.poster_url);
        });
      }
    } catch {}

    while (fillerPosters.length < 6) {
      fillerPosters.push('/poster-placeholder.svg');
    }

    for (let i = fillerPosters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fillerPosters[i], fillerPosters[j]] = [fillerPosters[j], fillerPosters[i]];
    }

    const reel = [
      ...fillerPosters.slice(0, 6),
      data.poster_url || '/poster-placeholder.svg',
    ];
    setReelPosters(reel);

    setTimeout(() => {
      setResult(data);
      setSpinning(false);
    }, SPIN_DURATION * 1000);
  }, [memberId, prefersReducedMotion]);

  useEffect(() => {
    if (isOpen && !result && !spinning && !empty) {
      spin();
    }
  }, [isOpen, result, spinning, empty, spin]);

  useEffect(() => {
    if (!isOpen) {
      setResult(null);
      setEmpty(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const posterHeight = 420;
  const posterWidth = 280;
  const totalReelHeight = reelPosters.length * (posterHeight + 16);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-rich-black/95 px-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-[420px] bg-charcoal rounded-card p-5 relative flex flex-col items-center"
          style={{ maxHeight: '90vh', overflow: 'hidden' }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center text-muted hover:text-cream btn-press rounded-full z-20"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <h2 className="text-xl font-bold text-center mb-4 text-warm-gold">
            Feeling lucky?
          </h2>

          {/* Spinning reel - BIG centered poster */}
          {spinning && (
            <div
              className="relative mx-auto mb-4 overflow-hidden rounded-card border-2 border-warm-gold"
              style={{ width: posterWidth, height: posterHeight }}
            >
              {/* Glow effect at top and bottom */}
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-charcoal to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-charcoal to-transparent z-10 pointer-events-none" />

              <motion.div
                className="flex flex-col gap-4"
                initial={{ y: 0 }}
                animate={{ y: -((reelPosters.length - 1) * (posterHeight + gap)) }}
                transition={{
                  duration: SPIN_DURATION,
                  ease: [0.2, 0.8, 0.3, 1],
                }}
              >
                {reelPosters.map((poster, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 rounded-btn overflow-hidden bg-smoke"
                    style={{ width: posterWidth, height: posterHeight }}
                  >
                    {poster !== '/poster-placeholder.svg' ? (
                      <img
                        src={poster}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        🍿
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            </div>
          )}

          {/* Result */}
          {!spinning && result && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              className="w-full"
            >
              <RecommendationCard
                rec={result}
                onWatch={(id) => {
                  onWatch(id);
                  onClose();
                }}
              />

              <button
                onClick={spin}
                className="w-full mt-4 py-3 bg-warm-gold text-rich-black rounded-btn font-bold btn-press min-h-[48px]"
              >
                Spin again
              </button>
            </motion.div>
          )}

          {/* Empty state */}
          {!spinning && empty && (
            <div className="text-center py-8">
              <p className="text-muted text-lg mb-2">You&apos;ve seen it all.</p>
              <p className="text-muted text-sm">Tell your friends to add more.</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
