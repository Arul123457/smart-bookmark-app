'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'

type Bookmark = {
  id: string
  title: string
  url: string
  created_at: string
}

export default function Dashboard() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  // -----------------------------
  // Fetch bookmarks
  // -----------------------------
  const fetchBookmarks = async () => {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setBookmarks(data)
    }
  }

  // -----------------------------
  // Auth + Realtime setup
  // -----------------------------
  useEffect(() => {
    let channel: RealtimeChannel

    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      setUser(user)
      await fetchBookmarks()
      setLoading(false)

      // Realtime subscription
      channel = supabase
        .channel('bookmarks-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookmarks',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setBookmarks((current) => [
                payload.new as Bookmark,
                ...current,
              ])
            }

            if (payload.eventType === 'DELETE') {
              setBookmarks((current) =>
                current.filter((b) => b.id !== payload.old.id)
              )
            }
          }
        )
        .subscribe()
    }

    init()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [router, supabase])

  // -----------------------------
  // Add bookmark
  // -----------------------------
  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !url || !user) return

    const formattedUrl = url.startsWith('http')
      ? url
      : `https://${url}`

    await supabase.from('bookmarks').insert([
      {
        title,
        url: formattedUrl,
        user_id: user.id,
      },
    ])

    setTitle('')
    setUrl('')
  }

  // -----------------------------
  // Delete bookmark
  // -----------------------------
  const handleDelete = async (id: string) => {
    await supabase.from('bookmarks').delete().eq('id', id)
  }

  // -----------------------------
  // Logout
  // -----------------------------
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // -----------------------------
  // Loading screen
  // -----------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            My Bookmarks
          </h1>
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Add Bookmark Form */}
        <form
          onSubmit={handleAddBookmark}
          className="bg-white p-6 rounded-lg shadow-md mb-6"
        >
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Add New Bookmark
          </h2>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Title (e.g., Google)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg 
              text-gray-900 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <input
              type="text"
              placeholder="URL (e.g., google.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg 
              text-gray-900 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
            >
              Add Bookmark
            </button>
          </div>
        </form>

        {/* Bookmark List */}
        <div className="space-y-3">
          {bookmarks.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No bookmarks yet. Add your first one above!
            </p>
          ) : (
            bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition"
              >
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <h3 className="font-semibold text-gray-800 hover:text-blue-600">
                    {bookmark.title}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {bookmark.url}
                  </p>
                </a>

                <button
                  onClick={() => 
                    handleDelete(bookmark.id)
                  }
                  className="ml-4 text-red-500 hover:text-red-700 font-medium px-3 py-1"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
