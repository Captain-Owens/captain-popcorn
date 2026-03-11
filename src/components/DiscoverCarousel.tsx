'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface DiscoverItem {
  id: number;
  title: string;
  poster_url: string;
  year: string;
  genre: string;
  tmdb_rating: number;
  type: string;
  overview: string;
}

interface DiscoverCarouselProps {
  items: DiscoverItem[];
  loading: boolean;
}

export default function DiscoverCarousel({ items, loading }: DiscoverCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchDelta = useRef(0);
  const isDragging = useRef(false);

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    setCurrentIndex(clamped);
  }, [items.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchDelta.current = 0;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (!isDragging.current && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      isDragging.current = true;
    }
    if (isDragging.current) {
      e.preventDefault();
      touchDelta.current = dx;
    }
  };

  const handleTouchEnd = () => {
    if (isDragging.current) {
      const threshold = 50;
      if (touchDelta.current < -threshold) goTo(currentIndex + 1);
      else if (touchDelta.current > threshold) goTo(currentIndex - 1);
    }
    touchDelta.current = 0;
    isDragging.current = false;
  };

  const handleSave = async (item: DiscoverItem) => {
    if (savingIds.has(item.id) || savedIds.has(item.id)) return;

    const memberId = typeof window !== 'undefined' ? localStorage.getItem('captain-popcorn-member-id') : null;
    if (!memberId) {
      alert('Please select a user first');
      return;
    }

    setSavingIds(prev => { const s = new Set(prev); s.add(item.id); return s; });

    try {
      // Step 1: Add to crew recommendations (or get existing if duplicate)
      const recRes = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdb_id: item.id,
          title: item.title,
          poster_url: item.poster_url,
          year: item.year,
          genre: item.genre,
          tmdb_rating: item.tmdb_rating,
          type: item.type,
          overview: item.overview,
          recommended_by: memberId,
        }),
      });

      let recId: string | null = null;

      if (recRes.ok) {
        const recData = await recRes.json();
        // Handle various response shapes
        recId = recData?.id || recData?.data?.id || recData?.[0]?.id || null;
      }

      // If the POST returned 409 or similar (duplicate), look up the existing rec
      if (!recId) {
        const lookupRes = await fetch(`/api/recommendations`);
        if (lookupRes.ok) {
          const allRecs = await lookupRes.json();
          const recs = Array.isArray(allRecs) ? allRecs : allRecs?.data || [];
          const match = recs.find((r: any) => r.tmdb_id === item.id);
          if (match) recId = match.id;
        }
      }

      if (recId) {
        // Step 2: Save to personal list
        await fetch('/api/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            member_id: memberId,
            recommendation_id: recId,
          }),
        });
      }

      // Mark as saved regardless - optimistic UI
      setSavedIds(prev => { const s = new Set(prev); s.add(item.id); return s; });
    } catch (err) {
      console.error('Save failed:', err);
      alert('Save failed - please try again');
    } finally {
      setSavingIds(prev => { const s = new Set(prev); s.delete(item.id); return s; });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '0 20px', marginBottom: 24 }}>
        <div style={{
          background: '#2a2a2e',
          borderRadius: 16,
          height: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
          fontSize: 14,
        }}>
          Finding movies for you...
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <div style={{ marginBottom: 24, position: 'relative' }}>
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          overflow: 'hidden',
          padding: '0 20px',
          touchAction: 'pan-y',
        }}
      >
        <div style={{
          display: 'flex',
          transition: 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          transform: `translateX(-${currentIndex * 100}%)`,
        }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{ flex: '0 0 100%', minWidth: '100%' }}
            >
              <div style={{
                background: '#2a2a2e',
                borderRadius: 16,
                overflow: 'hidden',
                position: 'relative',
              }}>
                <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3' }}>
                  {item.poster_url ? (
                    <Image
                      src={item.poster_url}
                      alt={item.title}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 480px) 100vw, 440px"
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%', background: '#1a1a1e',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#666', fontSize: 48,
                    }}>🎬</div>
                  )}

                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
                    background: 'linear-gradient(transparent, rgba(42,42,46,0.9), #2a2a2e)',
                    pointerEvents: 'none',
                  }} />

                  {/* BOOKMARK BUTTON */}
                  <button
                    onClick={() => handleSave(item)}
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      background: savedIds.has(item.id)
                        ? 'rgba(218, 165, 32, 0.95)'
                        : 'rgba(0, 0, 0, 0.6)',
                      border: savedIds.has(item.id)
                        ? '2px solid #DAA520'
                        : '2px solid rgba(255,255,255,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10,
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      transition: 'all 0.2s ease',
                      opacity: savingIds.has(item.id) ? 0.5 : 1,
                      padding: 0,
                    }}
                  >
                    {savingIds.has(item.id) ? (
                      <span style={{ fontSize: 18 }}>⏳</span>
                    ) : savedIds.has(item.id) ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    )}
                  </button>

                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '0 16px 12px', zIndex: 2,
                  }}>
                    <h3 style={{
                      fontSize: 20, fontWeight: 700, color: '#fff',
                      margin: '0 0 6px 0', lineHeight: 1.2,
                      textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                    }}>{item.title}</h3>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontSize: 13, color: '#ccc',
                    }}>
                      {item.year && <span>{item.year}</span>}
                      {item.tmdb_rating > 0 && (
                        <span style={{ color: '#DAA520' }}>★ {item.tmdb_rating.toFixed(1)}</span>
                      )}
                      {item.genre && <span style={{ opacity: 0.7 }}>{item.genre.split(',')[0]}</span>}
                      <span style={{
                        background: item.type === 'movie' ? '#DAA520' : '#4a9eff',
                        color: '#000', padding: '1px 6px', borderRadius: 4,
                        fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                      }}>{item.type === 'movie' ? 'Film' : 'Series'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: currentIndex === i ? 20 : 8, height: 8, borderRadius: 4,
              background: currentIndex === i ? '#DAA520' : 'rgba(255,255,255,0.2)',
              border: 'none', padding: 0, cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Desktop arrows */}
      {currentIndex > 0 && (
        <button onClick={() => goTo(currentIndex - 1)} style={{
          position: 'absolute', left: 8, top: '45%', transform: 'translateY(-50%)',
          width: 36, height: 36, borderRadius: 18, background: 'rgba(0,0,0,0.5)',
          border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3,
        }}>‹</button>
      )}
      {currentIndex < items.length - 1 && (
        <button onClick={() => goTo(currentIndex + 1)} style={{
          position: 'absolute', right: 8, top: '45%', transform: 'translateY(-50%)',
          width: 36, height: 36, borderRadius: 18, background: 'rgba(0,0,0,0.5)',
          border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3,
        }}>›</button>
      )}
    </div>
  );
}
