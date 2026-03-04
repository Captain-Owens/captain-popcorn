'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { STORAGE_KEY_MEMBER } from '@/lib/constants';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const memberId = localStorage.getItem(STORAGE_KEY_MEMBER);
    if (memberId) {
      router.replace('/home');
    } else {
      router.replace('/pick');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-dvh">
      <div className="flex flex-col items-center gap-4">
        <PopcornIcon />
        <p className="text-muted text-sm">Loading...</p>
      </div>
    </div>
  );
}

function PopcornIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="16" y="28" width="32" height="32" rx="4" fill="#E8A317" stroke="#8B1A1A" strokeWidth="2" />
      <line x1="24" y1="28" x2="20" y2="60" stroke="#8B1A1A" strokeWidth="1.5" />
      <line x1="40" y1="28" x2="44" y2="60" stroke="#8B1A1A" strokeWidth="1.5" />
      <circle cx="24" cy="18" r="8" fill="#FAF3E0" stroke="#E8A317" strokeWidth="1.5" />
      <circle cx="40" cy="18" r="8" fill="#FAF3E0" stroke="#E8A317" strokeWidth="1.5" />
      <circle cx="32" cy="14" r="9" fill="#FAF3E0" stroke="#E8A317" strokeWidth="1.5" />
      <circle cx="20" cy="24" r="6" fill="#FAF3E0" stroke="#E8A317" strokeWidth="1.5" />
      <circle cx="44" cy="24" r="6" fill="#FAF3E0" stroke="#E8A317" strokeWidth="1.5" />
    </svg>
  );
}
