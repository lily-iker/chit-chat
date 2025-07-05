import { useState, useEffect, useRef, useCallback } from 'react'
import { Search } from 'lucide-react'

interface GifObject {
  id: string
  title: string
  media_formats: {
    gif: {
      url: string
      dims: [number, number]
      size: number
    }
    tinygif: {
      url: string
      dims: [number, number]
      size: number
    }
  }
}

interface GifPickerProps {
  onGifSelect: (gifUrl: string) => void
  onClose: () => void
}

const GifPicker = ({ onGifSelect, onClose }: GifPickerProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [gifs, setGifs] = useState<GifObject[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextPos, setNextPos] = useState('')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const isLoadingRef = useRef(false) // Prevent multiple simultaneous requests
  const currentSearchRef = useRef('') // Track current search to prevent stale requests

  const TENOR_API_KEY = import.meta.env.VITE_TENOR_API_KEY

  const searchGifs = useCallback(
    async (query: string, pos = '') => {
      if (!query.trim()) {
        query = 'trending'
      }

      // Prevent multiple simultaneous requests
      if (isLoadingRef.current) return

      isLoadingRef.current = true
      currentSearchRef.current = query

      if (pos === '') {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      try {
        const response = await fetch(
          `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(
            query
          )}&key=${TENOR_API_KEY}&limit=20&pos=${pos}&media_filter=gif,tinygif`
        )

        const data = await response.json()

        // Check if this is still the current search (prevent stale updates)
        if (currentSearchRef.current !== query) {
          return
        }

        if (pos === '') {
          // New search - replace all GIFs
          setGifs(data.results || [])
        } else {
          // Load more - append new GIFs and filter duplicates
          setGifs((prev) => {
            const newGifs = data.results || []
            const existingIds = new Set(prev.map((gif) => gif.id))
            const uniqueNewGifs = newGifs.filter((gif: GifObject) => !existingIds.has(gif.id))
            return [...prev, ...uniqueNewGifs]
          })
        }
        setNextPos(data.next || '')
      } catch (error) {
        console.error('Error fetching GIFs:', error)
      } finally {
        setLoading(false)
        setLoadingMore(false)
        isLoadingRef.current = false
      }
    },
    [TENOR_API_KEY]
  )

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const query = searchTerm || 'trending'
      searchGifs(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, searchGifs])

  // Reset scroll position when searchTerm changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Infinite scroll handler with throttling
  const handleScroll = useCallback(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer || isLoadingRef.current || !nextPos) return

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer
    const threshold = 100 // Load more when 100px from bottom

    if (scrollHeight - scrollTop - clientHeight < threshold) {
      const query = searchTerm || 'trending'
      searchGifs(query, nextPos)
    }
  }, [searchTerm, nextPos, searchGifs])

  // Throttled scroll event listener
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    let ticking = false
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    scrollContainer.addEventListener('scroll', throttledHandleScroll, { passive: true })
    return () => {
      scrollContainer.removeEventListener('scroll', throttledHandleScroll)
    }
  }, [handleScroll])

  const handleGifClick = (gif: GifObject) => {
    const gifUrl = gif.media_formats.gif.url
    onGifSelect(gifUrl)
    onClose()
  }

  // Focus search input on mount
  useEffect(() => {
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
  }, [])

  return (
    <div className="w-96 h-96 bg-base-100 rounded-lg shadow-lg border border-base-300 flex flex-col">
      {/* Search */}
      <div className="p-4">
        <div className="p-2 border border-base-300 rounded-xl">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60"
              size={16}
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for GIFs..."
              className="input input-sm w-full pl-10 pr-4 focus:outline-none focus:border-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* GIF Grid */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-2">
        {loading && gifs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {gifs.map((gif) => (
                <div
                  key={gif.id}
                  className="aspect-square cursor-pointer rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                  onClick={() => handleGifClick(gif)}
                >
                  <img
                    src={gif.media_formats.tinygif.url || '/placeholder.svg'}
                    alt={gif.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>

            {/* Loading more indicator */}
            {loadingMore && (
              <div className="flex justify-center mt-4 pb-4">
                <span className="loading loading-spinner loading-sm"></span>
              </div>
            )}

            {/* End of results indicator */}
            {!nextPos && gifs.length > 0 && !loading && !loadingMore && (
              <div className="flex justify-center mt-4 pb-4">
                <span className="text-xs text-base-content/60">No more GIFs to load</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default GifPicker
