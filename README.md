# Smart Bookmark Manager

A real-time bookmark management application built with Next.js and Supabase.

## Live Demo
🔗 [[https://your-app.vercel.app](https://smart-bookmark-app-mu-eight.vercel.app
)

## Features
- Google OAuth authentication
- Private bookmarks per user
- Real-time updates across tabs
- Clean, responsive UI

## Tech Stack
- Next.js 14 (App Router)
- Supabase (Auth, Database, Realtime)
- Tailwind CSS
- TypeScript

## Problems & Solutions

### 1. Server vs Client Components
**Problem:** Confusion between server and client Supabase instances
**Solution:** Created separate utilities - `lib/supabase/client.ts` for browser, `lib/supabase/server.ts` for SSR

### 2. Real-time Not Working
**Problem:** Realtime subscriptions weren't receiving updates
**Solution:** Had to manually enable Realtime for the bookmarks table in Supabase dashboard

### 3. Deployment Auth Issues
**Problem:** Google OAuth broke after deploying to Vercel
**Solution:** Updated authorized redirect URIs in both Supabase settings and Google Cloud Console

## Local Setup
```bash
npm install
# Add .env.local with Supabase credentials
npm run dev
```

## Database Schema
```sql
create table bookmarks (
  id uuid primary key,
  user_id uuid references auth.users,
  title text,
  url text,
  created_at timestamp
);
```
