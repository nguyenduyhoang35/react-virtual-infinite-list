import { useState, useCallback, useRef, useEffect } from 'react'
import type {
  UseInfiniteListOptions,
  UseInfiniteListReturn,
  PaginationType,
  PagePagination,
  CursorPagination,
} from '../types'

export function useInfiniteList<TData, TItem, TPagination extends PaginationType>(
  options: UseInfiniteListOptions<TData, TItem, TPagination>
): UseInfiniteListReturn<TItem> {
  const {
    fetcher,
    pagination,
    getData,
    getTotal,
    getNextCursor,
    hasMore: hasMoreFn,
    enabled = true,
    onSuccess,
    onError,
  } = options

  const isPagePagination = pagination.type === 'page'
  const limit = pagination.limit ?? 20

  // State
  const [items, setItems] = useState<TItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hasMore, setHasMore] = useState(true)

  // Refs for pagination state
  const pageRef = useRef(
    isPagePagination ? ((pagination as PagePagination).initialPage ?? 1) : 1
  )
  const cursorRef = useRef<string | null>(
    !isPagePagination ? ((pagination as CursorPagination).initialCursor ?? null) : null
  )
  const totalRef = useRef<number | null>(null)
  const isFetchingRef = useRef(false)
  const isInitializedRef = useRef(false)

  // Determine if there's more data
  const checkHasMore = useCallback(
    (response: TData, allItems: TItem[]) => {
      // Custom hasMore function takes priority
      if (hasMoreFn) {
        return hasMoreFn(response, allItems)
      }

      // For cursor pagination, check if nextCursor exists
      if (!isPagePagination && getNextCursor) {
        const nextCursor = getNextCursor(response)
        return nextCursor !== null && nextCursor !== undefined
      }

      // For page pagination with total
      if (isPagePagination && getTotal) {
        const total = getTotal(response)
        totalRef.current = total
        return allItems.length < total
      }

      // Default: check if we got a full page
      const newItems = getData(response)
      return newItems.length >= limit
    },
    [hasMoreFn, isPagePagination, getNextCursor, getTotal, getData, limit]
  )

  // Ref to track current items for async operations
  const itemsRef = useRef<TItem[]>([])
  const hasMoreRef = useRef(true)

  // Core fetch function - returns { itemsCount, hasMore } for async operations
  const fetchData = useCallback(
    async (isLoadMore = false): Promise<{ itemsCount: number; hasMore: boolean }> => {
      if (isFetchingRef.current) return { itemsCount: itemsRef.current.length, hasMore: hasMoreRef.current }
      if (isLoadMore && !hasMoreRef.current) return { itemsCount: itemsRef.current.length, hasMore: false }

      isFetchingRef.current = true

      if (isLoadMore) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      try {
        // Build fetch params based on pagination type
        const params = isPagePagination
          ? { page: pageRef.current, limit }
          : { cursor: cursorRef.current, limit }

        const response = await fetcher(params as any)
        const newItems = getData(response)

        // Calculate all items
        const allItems = isLoadMore ? [...itemsRef.current, ...newItems] : newItems

        // Update items
        setItems(allItems)
        itemsRef.current = allItems

        // Update pagination state
        if (isPagePagination) {
          pageRef.current += 1
        } else if (getNextCursor) {
          cursorRef.current = getNextCursor(response)
        }

        // Check if there's more data
        const moreAvailable = checkHasMore(response, allItems)
        setHasMore(moreAvailable)
        hasMoreRef.current = moreAvailable

        // Callback
        onSuccess?.(response, allItems)

        return { itemsCount: allItems.length, hasMore: moreAvailable }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        onError?.(error)
        return { itemsCount: itemsRef.current.length, hasMore: hasMoreRef.current }
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
        isFetchingRef.current = false
      }
    },
    [
      fetcher,
      getData,
      getNextCursor,
      isPagePagination,
      limit,
      checkHasMore,
      onSuccess,
      onError,
    ]
  )

  // Load more function - returns { itemsCount, hasMore }
  const loadMore = useCallback(async () => {
    if (!hasMoreRef.current || isLoadingMore || isLoading) {
      return { itemsCount: itemsRef.current.length, hasMore: hasMoreRef.current }
    }
    return await fetchData(true)
  }, [isLoadingMore, isLoading, fetchData])

  // Load until we have at least targetCount items
  const loadUntilCount = useCallback(async (targetCount: number, maxAttempts = 100) => {
    let attempts = 0
    while (itemsRef.current.length < targetCount && hasMoreRef.current && attempts < maxAttempts) {
      const result = await fetchData(true)
      if (!result.hasMore) break
      attempts++
    }
    return { itemsCount: itemsRef.current.length, hasMore: hasMoreRef.current }
  }, [fetchData])

  // Reset function
  const reset = useCallback(() => {
    setItems([])
    setError(null)
    setHasMore(true)
    setIsLoading(false)
    setIsLoadingMore(false)
    pageRef.current = isPagePagination
      ? ((pagination as PagePagination).initialPage ?? 1)
      : 1
    cursorRef.current = !isPagePagination
      ? ((pagination as CursorPagination).initialCursor ?? null)
      : null
    totalRef.current = null
    isFetchingRef.current = false
    isInitializedRef.current = false
    itemsRef.current = []
    hasMoreRef.current = true
  }, [isPagePagination, pagination])

  // Refresh function (reset + fetch)
  const refresh = useCallback(async () => {
    reset()
    // Need to wait for state to reset
    await new Promise((resolve) => setTimeout(resolve, 0))
    await fetchData(false)
  }, [reset, fetchData])

  // Initial fetch
  useEffect(() => {
    if (enabled && !isInitializedRef.current) {
      isInitializedRef.current = true
      fetchData(false)
    }
  }, [enabled, fetchData])

  return {
    items,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    loadUntilCount,
    reset,
    refresh,
  }
}
