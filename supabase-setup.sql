-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- This creates all tables needed for Captain Popcorn

-- Households table
CREATE TABLE IF NOT EXISTS households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  household_id uuid REFERENCES households(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) <= 200),
  type text NOT NULL CHECK (type IN ('movie', 'show')),
  tmdb_id integer,
  poster_url text,
  year integer,
  genre text,
  tmdb_rating numeric(3,1),
  platform text CHECK (platform IN ('netflix', 'hbo', 'prime', 'disney', 'hulu', 'paramount', 'other') OR platform IS NULL),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text CHECK (char_length(comment) <= 280),
  created_at timestamptz DEFAULT now()
);

-- Watched table
CREATE TABLE IF NOT EXISTS watched (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  recommendation_id uuid NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(member_id, recommendation_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_member_id ON recommendations(member_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_rating ON recommendations(rating DESC);
CREATE INDEX IF NOT EXISTS idx_watched_member_id ON watched(member_id);
CREATE INDEX IF NOT EXISTS idx_watched_recommendation_id ON watched(recommendation_id);

-- Enable Realtime on both tables
ALTER PUBLICATION supabase_realtime ADD TABLE recommendations;
ALTER PUBLICATION supabase_realtime ADD TABLE watched;
