'use client';

import { Platform } from '@/lib/types';

interface PlatformLogoProps {
  platform: Platform;
  size?: number;
  colored?: boolean;
}

export default function PlatformLogo({ platform, size = 20, colored = true }: PlatformLogoProps) {
  const gray = '#8A8A7A';
  const s = size;

  switch (platform) {
    case 'netflix':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <path d="M6.5 2V22L12 12.5L17.5 22V2" fill="none" stroke={colored ? '#E50914' : gray} strokeWidth="0" />
          <rect x="6" y="2" width="3.5" height="20" rx="0.5" fill={colored ? '#E50914' : gray} />
          <rect x="14.5" y="2" width="3.5" height="20" rx="0.5" fill={colored ? '#E50914' : gray} />
          <polygon points="6,2 18,22 18,14 6,2" fill={colored ? '#B20710' : gray} />
          <polygon points="6,2 9.5,2 18,18 18,22" fill={colored ? '#E50914' : gray} />
        </svg>
      );
    case 'hbo':
      return (
        <svg width={s * 1.4} height={s} viewBox="0 0 56 24">
          <rect x="0" y="0" width="56" height="24" rx="4" fill={colored ? '#000' : '#2A2A2A'} />
          <text x="28" y="17.5" textAnchor="middle" fontWeight="900" fontSize="15" letterSpacing="2" fontFamily="'Helvetica Neue', Arial, sans-serif" fill={colored ? '#fff' : gray}>HBO</text>
        </svg>
      );
    case 'prime':
      return (
        <svg width={s * 1.2} height={s} viewBox="0 0 48 24">
          <text x="24" y="15" textAnchor="middle" fontWeight="700" fontSize="12" fontFamily="'Helvetica Neue', Arial, sans-serif" fill={colored ? '#00A8E1' : gray}>prime</text>
          <path d="M8 19C8 19 14 22 24 22C34 22 40 19 40 19" stroke={colored ? '#00A8E1' : gray} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M36 17L40 19.5L36 21" stroke={colored ? '#00A8E1' : gray} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );
    case 'disney':
      return (
        <svg width={s * 1.2} height={s} viewBox="0 0 48 24">
          <text x="20" y="18" textAnchor="middle" fontWeight="700" fontSize="16" fontStyle="italic" fontFamily="Georgia, serif" fill={colored ? '#113CCF' : gray}>Disney</text>
          <text x="43" y="12" textAnchor="middle" fontWeight="800" fontSize="14" fontFamily="Arial, sans-serif" fill={colored ? '#113CCF' : gray}>+</text>
        </svg>
      );
    case 'hulu':
      return (
        <svg width={s * 1.2} height={s} viewBox="0 0 48 24">
          <rect x="0" y="0" width="48" height="24" rx="4" fill={colored ? '#1CE783' : '#2A2A2A'} />
          <text x="24" y="17" textAnchor="middle" fontWeight="900" fontSize="14" letterSpacing="1" fontFamily="'Helvetica Neue', Arial, sans-serif" fill={colored ? '#fff' : gray}>hulu</text>
        </svg>
      );
    case 'paramount':
      return (
        <svg width={s * 1.2} height={s} viewBox="0 0 48 24">
          <path d="M24 2L18 16H30L24 2Z" fill={colored ? '#0064FF' : gray} />
          <path d="M20 4L24 2L28 4" fill="none" stroke={colored ? '#0064FF' : gray} strokeWidth="0.5" />
          <path d="M15 12L24 1L33 12" fill="none" stroke={colored ? '#0064FF' : gray} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M18 9L24 2L30 9" fill="none" stroke={colored ? '#0064FF' : gray} strokeWidth="1.2" strokeLinejoin="round" />
          <text x="24" y="22" textAnchor="middle" fontWeight="800" fontSize="7" fontFamily="Arial, sans-serif" fill={colored ? '#0064FF' : gray}>P+</text>
        </svg>
      );
    case 'other':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={colored ? '#8A8A7A' : gray} strokeWidth="1.5" />
          <circle cx="12" cy="12" r="1.5" fill={colored ? '#8A8A7A' : gray} />
          <circle cx="8" cy="12" r="1.5" fill={colored ? '#8A8A7A' : gray} />
          <circle cx="16" cy="12" r="1.5" fill={colored ? '#8A8A7A' : gray} />
        </svg>
      );
    default:
      return null;
  }
}
