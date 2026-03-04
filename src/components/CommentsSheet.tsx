'use client';

import { useState, useEffect, useRef } from 'react';

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
  const [deleting, setDeleting] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && recommendationId) {
      fetchComments();
    }
    if (!isOpen) {
      setComments([]);
      setText('');
      setLoading(true);
    }
  }, [isOpen, recommendationId]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
  }, [isOpen]);

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
      }
    } catch {}
    setSending(false);
  }

  async function handleDelete(commentId: string) {
    setDeleting(commentId);
    try {
      const res = await fetch('/api/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId, member_id: memberId }),
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch {}
    setDeleting(null);
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
        zIndex: 10000,
        backgroundColor: '#1A1A1A',
        display: 'flex',
        flexDirection: 'column',
        transform: 'translate3d(0,0,0)',
        WebkitTransform: 'translate3d(0,0,0)',
      }}
    >
      {/* Header */}
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
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
            {recommendationTitle}
          </h3>
          <p style={{ fontSize: 12, color: '#8A8A7A', marginTop: 2, margin: 0 }}>
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
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Comments list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px 20px',
          WebkitOverflowScrolling: 'touch' as any,
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, backgroundColor: '#3A3A3A' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 12, width: 80, marginBottom: 8, backgroundColor: '#3A3A3A', borderRadius: 4 }} />
                  <div style={{ height: 16, width: '100%', backgroundColor: '#3A3A3A', borderRadius: 4 }} />
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
                    {c.member_id === memberId && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deleting === c.id}
                        style={{
                          marginLeft: 'auto',
                          padding: '4px 8px',
                          fontSize: 11,
                          color: deleting === c.id ? '#555' : '#ff4444',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: deleting === c.id ? 'default' : 'pointer',
                          borderRadius: 4,
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        {deleting === c.id ? '...' : 'Delete'}
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4, lineHeight: 1.5, margin: '4px 0 0 0' }}>{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input bar */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
          padding: '12px 16px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          borderTop: '1px solid #3A3A3A',
          backgroundColor: '#1A1A1A',
          transform: 'translate3d(0,0,0)',
          WebkitTransform: 'translate3d(0,0,0)',
          position: 'relative',
          zIndex: 10001,
        }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Say something..."
          maxLength={500}
          autoComplete="off"
          autoCapitalize="sentences"
          rows={1}
          inputMode="text"
          style={{
            flex: 1,
            minHeight: 48,
            maxHeight: 96,
            fontSize: 16,
            fontFamily: 'inherit',
            backgroundColor: '#2A2A2A',
            border: '1px solid #4A4A4A',
            borderRadius: 24,
            padding: '12px 18px',
            color: '#FFFFFF',
            outline: 'none',
            resize: 'none',
            lineHeight: '24px',
            WebkitUserSelect: 'text' as any,
            userSelect: 'text' as any,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
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
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
          }}
        >
          {sending ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
