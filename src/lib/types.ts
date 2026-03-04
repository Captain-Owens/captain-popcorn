export interface Member {
  id: string;
  name: string;
  household_id: string | null;
  created_at: string;
}

export interface Household {
  id: string;
  name: string;
  created_at: string;
}

export interface Recommendation {
  id: string;
  member_id: string;
  title: string;
  type: 'movie' | 'show';
  tmdb_id: number | null;
  poster_url: string | null;
  year: number | null;
  genre: string | null;
  tmdb_rating: number | null;
  platform: Platform | null;
  rating: number | null;
  comment: string | null;
  created_at: string;
  // Joined fields
  recommender_name?: string;
  household_name?: string;
  watch_count?: number;
  is_watched?: boolean;
  // Likes
  like_count?: number;
  is_liked?: boolean;
}

export interface Watched {
  id: string;
  member_id: string;
  recommendation_id: string;
  created_at: string;
}

export type Platform =
  | 'netflix'
  | 'hbo'
  | 'prime'
  | 'disney'
  | 'hulu'
  | 'paramount'
  | 'other';

export interface TMDBSearchResult {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  genre_ids: number[];
  vote_average: number;
  media_type: 'movie' | 'tv';
  overview: string;
}

export interface TMDBParsed {
  tmdb_id: number;
  title: string;
  poster_url: string | null;
  year: number | null;
  genre: string | null;
  tmdb_rating: number | null;
  type: 'movie' | 'show';
}
