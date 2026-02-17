# Smart Bookmark Manager

A real-time bookmark management application built with Next.js (App Router) and Supabase.

---

## 1 Live Demo

🔗 https://smart-bookmark-app-mu-eight.vercel.app

---

## 2 Features

- Google OAuth authentication (no email/password)
- Private bookmarks per authenticated user
- Real-time updates across multiple tabs
- Secure Row Level Security (RLS)
- Clean, responsive UI with Tailwind CSS
- Deployed on Vercel

---

## 3 Tech Stack

- Next.js (App Router)
- Supabase (Auth, PostgreSQL, Realtime)
- Tailwind CSS
- TypeScript
- Vercel (Deployment)

---

## 4 Architecture Overview

- Supabase handles Google OAuth authentication and session management.
- Each bookmark is linked to `auth.users` via a `user_id` foreign key.
- Row Level Security (RLS) ensures users can only access their own bookmarks.
- Supabase Realtime listens to database changes and updates the UI instantly across tabs.

---

## 5 Problems Faced & How I Solved Them

### 1️⃣ Server vs Client Component Confusion

**Problem:**  
Using Supabase directly inside Server Components caused errors because browser APIs (like localStorage) are not available on the server.

**Solution:**  
I separated Supabase utilities into:
- `lib/supabase/client.ts` → Browser-only instance  
- `lib/supabase/server.ts` → Server-safe instance  

This ensured authentication and database calls worked correctly in both environments.

---

### 2️⃣ Realtime Updates Not Triggering

**Problem:**  
Realtime subscriptions were not receiving updates even though the frontend subscription code was correct.

**Solution:**  
Supabase requires explicitly enabling realtime for tables. I executed:

```sql
alter publication supabase_realtime add table bookmarks;
```

After enabling this, live updates worked correctly across multiple tabs.

---

### 3️⃣ Google OAuth Failing After Deployment

**Problem:**  
Google login worked locally but failed in production with a `redirect_uri_mismatch` error.

**Solution:**  
I updated:
- Supabase → Authentication → URL Configuration (added Vercel domain)
- Google Cloud Console → Authorized Redirect URIs (added Supabase callback + production URL)

This resolved the authentication issue in production.

---

### 4️⃣ Securing User Data with Row Level Security (RLS)

**Problem:**  
Without proper access control, users could potentially read or modify other users’ bookmarks.

**Solution:**  
I enabled Row Level Security and created policies:

- Users can SELECT only their own rows
- Users can INSERT only rows where `user_id = auth.uid()`
- Users can DELETE only their own bookmarks

This ensures strict per-user data isolation.

---

## 6 Database Schema

```sql
create table bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  url text not null,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

alter table bookmarks enable row level security;

create policy "Users can view own bookmarks"
  on bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can insert own bookmarks"
  on bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own bookmarks"
  on bookmarks for delete
  using (auth.uid() = user_id);

alter publication supabase_realtime add table bookmarks;
```

---

## 7 Local Setup

```bash
npm install
```

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Then run:

```bash
npm run dev
```

---

## 8 How Realtime Works

- Supabase listens to INSERT and DELETE events on the `bookmarks` table.
- A subscription filters changes by `user_id`.
- When a change occurs, the UI updates instantly without page refresh.

---

## 9 Deployment

- Hosted on Vercel
- Supabase project configured with production URL
- Google OAuth configured with correct redirect URIs
- Environment variables added in Vercel settings

---


- Clean UI/UX
- Real-time data synchronization
