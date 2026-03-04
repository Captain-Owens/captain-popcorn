'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Recommendation } from '@/lib/types';
import RecommendationCard from './RecommendationCard';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  recommendations: Recommendation[];
  onWatch: (id: string) => void;
  onUnwatch: (id: string) => void;
}

export default function SearchOverlay({
  isOpen,
  onClose,
  recommendations,
  onWatch,
  onUnwatch,
}: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Cmd+K handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filtered = query.length > 0
    ? recommendations.filter((r) =>
        r.title.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-rich-black/95 px-4 pt-4 pb-20 overflow-y-auto"
      >
        <div className="max-w-[440px] mx-auto">
          <div className="relative mb-4">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles..."
              className="pr-10"
            />
            <button
              onClick={onClose}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream btn-press"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {query.length > 0 && filtered.length === 0 && (
            <p className="text-muted text-center py-8">No matches found.</p>
          )}

          <div className="flex flex-col gap-3">
            {filtered.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                onWatch={onWatch}
                onUnwatch={onUnwatch}
                showWatched={rec.is_watched}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
