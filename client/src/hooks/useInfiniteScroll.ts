import { useCallback, useRef } from 'react'

interface UseInfiniteScrollOptions {
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => Promise<void> | void
  threshold?: number
  direction?: 'top' | 'bottom'
}

export const useInfiniteScroll = ({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 50,
  direction = 'bottom',
}: UseInfiniteScrollOptions) => {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const handleScroll = useCallback(async () => {
    if (!containerRef.current || isLoading || !hasMore) return

    const container = containerRef.current
    const { scrollTop, scrollHeight, clientHeight } = container

    let shouldLoad = false

    if (direction === 'bottom') {
      // Load more when scrolled near bottom
      shouldLoad = scrollHeight - scrollTop - clientHeight <= threshold
    } else {
      // Load more when scrolled near top
      shouldLoad = scrollTop <= threshold
    }

    if (shouldLoad) {
      await onLoadMore()
    }
  }, [hasMore, isLoading, onLoadMore, threshold, direction])

  return {
    containerRef,
    handleScroll,
  }
}
