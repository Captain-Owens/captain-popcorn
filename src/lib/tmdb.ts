import { TMDBParsed, TMDBSearchResult } from './types';
import { TMDB_GENRES, TMDB_POSTER_MD } from './constants';

const TMDB_BASE = 'https://api.themoviedb.org/3';

export async function searchTMDB(
  query: string,
  type: 'movie' | 'tv' = 'movie'
): Promise<TMDBParsed[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error('TMDB_API_KEY not set');

  const url = `${TMDB_BASE}/search/${type}?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=1`;
  const res = await fetch(url);

  if (!res.ok) throw new Error(`TMDB search failed: ${res.status}`);

  const data = await res.json();
  const results: TMDBSearchResult[] = data.results || [];

  return results.slice(0, 8).map((item) => {
    const title = type === 'movie'
      ? (item as any).title
      : (item as any).name;
    const releaseDate = type === 'movie'
      ? (item as any).release_date
      : (item as any).first_air_date;

    return {
      tmdb_id: item.id,
      title: title || 'Unknown',
      poster_url: item.poster_path
        ? `${TMDB_POSTER_MD}${item.poster_path}`
        : null,
      year: releaseDate ? parseInt(releaseDate.split('-')[0], 10) : null,
      genre: item.genre_ids
        ?.slice(0, 2)
        .map((id: number) => TMDB_GENRES[id])
        .filter(Boolean)
        .join(', ') || null,
      tmdb_rating: item.vote_average
        ? Math.round(item.vote_average * 10) / 10
        : null,
      type: type === 'movie' ? 'movie' : 'show',
    };
  });
}
