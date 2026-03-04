'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Comment {
  id: string;
  text: string;
  member_name: string;
  member_id: string;
  created_at: string;
}

interface CommentsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  recommendationId: string;
  recommendationTitle: string;
  memberId: string;
}

export default function CommentsSheet({
  isOpen,
  onClose,
  recommendationId,
  recommendationTitle,
  memberId,
}: CommentsSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      setComments([]);
      setText('');
    }
  }, [isOpen, recommendationId]);

  async function fetchComments() {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?recommendation_id=${recommendationId}`);
      const data = await res.json();
      if (Array.isArray(data)) setComments(data);
    } catch {}
    setLoading(false);
  }

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId,
          recommendation_id: recommendationId,
          text: text.trim(),
        }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [newComment, ...prev]);
        setText('');
      }
    } catch {}
    setSending(false);
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-[480px] rounded-t-2xl overflow-hidden flex flex-col"
          style={{
            backgroundColor: '#2A2A2A',
            maxHeight: '75vh',
            boxShadow: '0 -4px 30px rgba(0,0,0,0.5)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-smoke">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-cream truncate">{recommendationTitle}</h3>
              <p className="text-xs text-muted">
                {comments.length} comment{comments.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full btn-press flex-shrink-0"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A8A7A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto px-5 py-3" style={{ minHeight: 120 }}>
            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <div className="skeleton h-3 w-20 mb-2" />
                      <div className="skeleton h-4 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-muted text-sm">No comments yet. Be the first!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: '#3A3A3A', color: '#E8A317' }}
                    >
                      {c.member_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-cream">{c.member_name}</span>
                        <span className="text-xs text-muted">{timeAgo(c.created_at)}</span>
                      </div>
                      <p className="text-sm text-cream/90 mt-0.5 leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-smoke flex gap-2 items-center"
            style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Add a comment..."
              maxLength={500}
              className="flex-1"
              style={{ minHeight: 44, fontSize: 14 }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="px-4 py-2.5 bg-warm-gold text-rich-black rounded-btn font-bold text-sm btn-press disabled:opacity-40"
              style={{ minHeight: 44 }}
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
