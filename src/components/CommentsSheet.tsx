'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

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
    if (isOpen && recommendationId) {
      fetchComments();
      // Delay focus so the modal is rendered first
      const t = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.click();
        }
      }, 500);
      return () => clearTimeout(t);
    }
    if (!isOpen) {
      setComments([]);
      setText('');
      setLoading(true);
    }
  }, [isOpen, recommendationId]);

  async function fetchComments() {
    setLoading(true);
    try {
      const res = await fetch('/api/comments?recommendation_id=' + recommendationId);
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
        inputRef.current?.focus();
      }
    } catch {}
    setSending(false);
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    const days = Math.floor(hrs / 24);
    if (days < 7) return days + 'd ago';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: '#1A1A1A',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #3A3A3A',
          flexShrink: 0,
        }}
      >
        <div style={{ minWidth: 0, flex: 1, paddingRight: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {recommendationTitle}
          </h3>
          <p style={{ fontSize: 12, color: '#8A8A7A', marginTop: 2 }}>
            {loading ? '...' : comments.length + ' comment' + (comments.length !== 1 ? 's' : '')}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: '#3A3A3A',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Comments list - scrollable */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 12, width: 80, marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 16, width: '100%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
            <p style={{ fontSize: 14, color: '#8A8A7A' }}>No comments yet. Start the conversation!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {comments.map((c) => (
              <div key={c.id} style={{ display: 'flex', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    backgroundColor: '#3A3A3A',
                    color: '#E8A317',
                    flexShrink: 0,
                  }}
                >
                  {c.member_name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{c.member_name}</span>
                    <span style={{ fontSize: 11, color: '#8A8A7A' }}>{timeAgo(c.created_at)}</span>
                  </div>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4, lineHeight: 1.5 }}>{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input bar - always visible at bottom */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          padding: '12px 16px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          borderTop: '1px solid #3A3A3A',
          backgroundColor: '#1A1A1A',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(); }}
          placeholder="Say something..."
          maxLength={500}
          autoComplete="off"
          autoCapitalize="sentences"
          enterKeyHint="send"
          style={{
            flex: 1,
            height: 48,
            fontSize: 16,
            backgroundColor: '#2A2A2A',
            border: '1px solid #4A4A4A',
            borderRadius: 24,
            padding: '0 18px',
            color: '#FFFFFF',
            outline: 'none',
            WebkitAppearance: 'none',
            appearance: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{
            height: 48,
            paddingLeft: 20,
            paddingRight: 20,
            backgroundColor: text.trim() && !sending ? '#E8A317' : '#3A3A3A',
            color: text.trim() && !sending ? '#1A1A1A' : '#8A8A7A',
            borderRadius: 24,
            fontWeight: 700,
            fontSize: 14,
            border: 'none',
            cursor: text.trim() && !sending ? 'pointer' : 'default',
            flexShrink: 0,
          }}
        >
          {sending ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
