# Captain Popcorn - Setup Guide

## Step 1: Get Your API Keys

### Supabase (database)
1. Go to https://supabase.com and sign in
2. Click "New Project", name it "captain-popcorn"
3. Wait for it to finish creating (about 1 minute)
4. Go to Settings > API
5. Copy "Project URL" and "anon public" key

### TMDB (movie data)
1. Go to https://www.themoviedb.org and create an account
2. Go to Settings > API (left sidebar)
3. Request an API key (choose "Developer", fill in the form)
4. Copy your API key (v3 auth)

## Step 2: Set Up Environment Variables

1. In your captain-popcorn folder, copy the example file:
```
cp .env.local.example .env.local
```

2. Open .env.local and paste your keys:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-long-key-here
TMDB_API_KEY=your-tmdb-key-here
```

## Step 3: Create Database Tables

1. In Supabase dashboard, click "SQL Editor" in the left sidebar
2. Click "New Query"
3. Open the file `supabase-setup.sql` from this project
4. Copy all the SQL and paste it into the editor
5. Click "Run" (or Cmd+Enter)
6. You should see "Success. No rows returned" - that means it worked

## Step 4: Install and Run

In your terminal:
```
cd captain-popcorn
npm install
npm run dev
```

Open http://localhost:3000 in your browser. You should see Captain Popcorn.

## Step 5: Deploy to Vercel

1. Push to GitHub:
```
git init
git add .
git commit -m "Captain Popcorn v1"
git remote add origin https://github.com/YOUR-USERNAME/captain-popcorn.git
git push -u origin main
```

2. Go to https://vercel.com and sign in with GitHub
3. Click "Import Project" and select captain-popcorn
4. Before deploying, add your environment variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - TMDB_API_KEY
5. Click "Deploy"
6. You'll get a URL like captain-popcorn.vercel.app
7. Share that URL with your friends

## Troubleshooting

**"Module not found" errors**: Run `npm install` again.

**Blank page**: Check that .env.local has your Supabase URL and key. Restart the dev server after changing env vars.

**TMDB search not working**: Make sure TMDB_API_KEY is set in .env.local (no NEXT_PUBLIC_ prefix for this one, it stays server-side).

**Database errors**: Make sure you ran the full SQL from supabase-setup.sql. Check the Supabase table editor to see if the tables exist.
