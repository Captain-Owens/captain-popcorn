import { Platform } from './types';

export const PLATFORMS: { slug: Platform; label: string; color: string }[] = [
  { slug: 'netflix', label: 'Netflix', color: '#E50914' },
  { slug: 'hbo', label: 'HBO', color: '#8B5CF6' },
  { slug: 'prime', label: 'Prime', color: '#00A8E1' },
  { slug: 'disney', label: 'Disney+', color: '#113CCF' },
  { slug: 'hulu', label: 'Hulu', color: '#1CE783' },
  { slug: 'paramount', label: 'Paramount+', color: '#0064FF' },
  { slug: 'other', label: 'Other', color: '#D0C8C0' },
];

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
export const TMDB_POSTER_SM = `${TMDB_IMAGE_BASE}/w185`;
export const TMDB_POSTER_MD = `${TMDB_IMAGE_BASE}/w342`;
export const TMDB_POSTER_LG = `${TMDB_IMAGE_BASE}/w500`;

export const TMDB_GENRES: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi', 10766: 'Soap', 10767: 'Talk', 10768: 'Politics',
};

export const STORAGE_KEY_MEMBER = 'captain-popcorn-member-id';
export const STORAGE_KEY_MEMBER_NAME = 'captain-popcorn-member-name';
