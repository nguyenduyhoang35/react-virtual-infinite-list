import React, { useMemo, useCallback, useImperativeHandle, forwardRef, CSSProperties } from 'react'
import { useInfiniteList } from '../hooks/useInfiniteList'
import { useVirtualList } from '../hooks/useVirtualList'
import { useIntersectionObserver } from '../hooks/useIntersectionObserver'
import type { InfiniteListProps, PaginationType, GridOptions } from '../types'

export interface InfiniteListRef {
  reset: () => void
  refresh: () => Promise<void>
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void
  scrollToIndexWithAutoLoad: (index: number, align?: 'start' | 'center' | 'end') => Promise<void>
  getLoadedCount: () => number
}

function InfiniteListInner<TData, TItem, TPagination extends PaginationType>(
  props: InfiniteListProps<TData, TItem, TPagination>,
  ref: React.ForwardedRef<InfiniteListRef>
) {
  const {
    fetcher,
    pagination,
    getData,
    getTotal,
    getNextCursor,
    hasMore: hasMoreFn,
    children,
    keyExtractor,
    layout = 'list',
    grid,
    virtualized,
    loader = <div>Loading...</div>,
    endMessage = <div>No more items</div>,
    errorMessage,
    emptyMessage = <div>No items found</div>,
    threshold = 200,
    reverse = false,
    className,
    style,
    containerClassName,
    containerStyle,
    onLoadMore,
    onError,
    onSuccess,
    enabled = true,
  } = props

  // Generate grid styles
  const gridStyles = useMemo((): CSSProperties | undefined => {
    if (layout !== 'grid') return undefined

    const {
      columns = 'auto-fill',
      minItemWidth = 200,
      gap = 16,
      rowGap,
      columnGap,
    } = grid || {}

    const gridTemplateColumns =
      typeof columns === 'number'
        ? `repeat(${columns}, 1fr)`
        : `repeat(${columns}, minmax(${minItemWidth}px, 1fr))`

    return {
      display: 'grid',
      gridTemplateColumns,
      gap: typeof gap === 'number' ? `${gap}px` : gap,
      rowGap: rowGap ? (typeof rowGap === 'number' ? `${rowGap}px` : rowGap) : undefined,
      columnGap: columnGap ? (typeof columnGap === 'number' ? `${columnGap}px` : columnGap) : undefined,
    }
  }, [layout, grid])

  // Infinite list hook
  const {
    items,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    loadUntilCount,
    reset,
    refresh,
  } = useInfiniteList({
    fetcher,
    pagination,
    getData,
    getTotal,
    getNextCursor,
    hasMore: hasMoreFn,
    enabled,
    onSuccess,
    onError,
  })

  // Callback for load more (used by both virtual scroll and intersection observer)
  const handleLoadMore = useCallback(() => {
    if (!isLoading && !isLoadingMore && hasMore) {
      loadMore()
      onLoadMore?.()
    }
  }, [isLoading, isLoadingMore, hasMore, loadMore, onLoadMore])

  // Virtual list hook (only if virtualized is enabled)
  const virtualList = useVirtualList({
    items,
    itemHeight: virtualized?.itemHeight ?? 50,
    overscan: virtualized?.overscan ?? 5,
    onNearEnd: virtualized ? handleLoadMore : undefined, // Scroll-based load more for virtual list
    nearEndThreshold: threshold,
    useWindowScroll: virtualized?.useWindowScroll ?? false,
  })

  const { virtualItems, totalHeight, containerRef, scrollToIndex } = virtualList

  // Intersection observer for infinite scroll (non-virtualized only)
  const { targetRef: sentinelRef } = useIntersectionObserver({
    rootMargin: `${threshold}px`,
    enabled: enabled && !virtualized && hasMore && !isLoading && !isLoadingMore,
    onIntersect: handleLoadMore,
  })

  // Auto-load until index is available, then scroll
  const scrollToIndexWithAutoLoad = useCallback(
    async (index: number, align: 'start' | 'center' | 'end' = 'start') => {
      // If index is already loaded, just scroll
      if (index < items.length) {
        scrollToIndex(index, align)
        return
      }

      // Need to load more items - use loadUntilCount to fetch until we have enough
      const targetCount = index + 1 // Need at least index+1 items to scroll to index
      const result = await loadUntilCount(targetCount)

      if (result.itemsCount <= index) {
        console.warn(`Cannot scroll to index ${index}: only ${result.itemsCount} items available`)
        return
      }

      // After loading, scroll to index
      // Use setTimeout to ensure React state has updated
      setTimeout(() => {
        scrollToIndex(index, align)
      }, 50)
    },
    [items.length, loadUntilCount, scrollToIndex]
  )

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    reset,
    refresh,
    scrollToIndex,
    scrollToIndexWithAutoLoad,
    getLoadedCount: () => items.length,
  }), [reset, refresh, scrollToIndex, scrollToIndexWithAutoLoad, items.length])

  // Get key for item
  const getKey = useCallback(
    (item: TItem, index: number) => {
      if (keyExtractor) {
        return keyExtractor(item, index)
      }
      // Try common key fields
      const anyItem = item as any
      return anyItem.id ?? anyItem._id ?? anyItem.key ?? index
    },
    [keyExtractor]
  )

  // Render error
  const renderError = useMemo(() => {
    if (!error) return null

    if (typeof errorMessage === 'function') {
      return errorMessage(error, refresh)
    }

    return (
      errorMessage ?? (
        <div>
          <p>Error: {error.message}</p>
          <button onClick={refresh}>Retry</button>
        </div>
      )
    )
  }, [error, errorMessage, refresh])

  // Render with virtualization
  if (virtualized) {
    return (
      <div className={className} style={style}>
        {/* Initial loading */}
        {isLoading && items.length === 0 && loader}

        {/* Error state */}
        {error && items.length === 0 && renderError}

        {/* Empty state */}
        {!isLoading && !error && items.length === 0 && emptyMessage}

        {/* Virtual list container */}
        {items.length > 0 && (
          <div
            ref={containerRef}
            className={containerClassName}
            style={virtualized.useWindowScroll
              ? { ...containerStyle } // No fixed height/overflow for window scroll
              : {
                  overflow: 'auto',
                  height: virtualized.containerHeight ?? '100%',
                  ...containerStyle,
                }
            }
          >
            <div
              style={{
                height: totalHeight,
                position: 'relative',
              }}
            >
              {virtualItems.map((virtualItem) => {
                const item = items[virtualItem.index]
                if (!item) return null

                return (
                  <div
                    key={getKey(item, virtualItem.index)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: virtualItem.size,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    {children(item, virtualItem.index)}
                  </div>
                )
              })}
            </div>

            {/* Load more sentinel */}
            <div ref={sentinelRef} style={{ height: 1 }} />

            {/* Loading more indicator */}
            {isLoadingMore && loader}

            {/* End message */}
            {!hasMore && !isLoadingMore && items.length > 0 && endMessage}
          </div>
        )}
      </div>
    )
  }

  // Render without virtualization
  const orderedItems = reverse ? [...items].reverse() : items

  return (
    <div className={className} style={style}>
      {/* Initial loading */}
      {isLoading && items.length === 0 && loader}

      {/* Error state */}
      {error && items.length === 0 && renderError}

      {/* Empty state */}
      {!isLoading && !error && items.length === 0 && emptyMessage}

      {/* Items container */}
      {items.length > 0 && (
        <div
          className={containerClassName}
          style={{
            ...gridStyles,
            ...containerStyle,
          }}
        >
          {/* Reverse: load more at top */}
          {reverse && (
            <>
              <div ref={sentinelRef} style={{ height: 1, gridColumn: layout === 'grid' ? '1 / -1' : undefined }} />
              {isLoadingMore && <div style={{ gridColumn: layout === 'grid' ? '1 / -1' : undefined }}>{loader}</div>}
            </>
          )}

          {/* Render items */}
          {orderedItems.map((item, idx) => {
            const originalIndex = reverse ? items.length - 1 - idx : idx
            return (
              <React.Fragment key={getKey(item, originalIndex)}>
                {children(item, originalIndex)}
              </React.Fragment>
            )
          })}

          {/* Normal: load more at bottom */}
          {!reverse && (
            <>
              <div ref={sentinelRef} style={{ height: 1, gridColumn: layout === 'grid' ? '1 / -1' : undefined }} />
              {isLoadingMore && <div style={{ gridColumn: layout === 'grid' ? '1 / -1' : undefined }}>{loader}</div>}
              {!hasMore && !isLoadingMore && <div style={{ gridColumn: layout === 'grid' ? '1 / -1' : undefined }}>{endMessage}</div>}
            </>
          )}

          {/* Reverse: end message at bottom */}
          {reverse && !hasMore && !isLoadingMore && <div style={{ gridColumn: layout === 'grid' ? '1 / -1' : undefined }}>{endMessage}</div>}
        </div>
      )}
    </div>
  )
}

// Forward ref wrapper with generics support
export const InfiniteList = forwardRef(InfiniteListInner) as <
  TData,
  TItem,
  TPagination extends PaginationType
>(
  props: InfiniteListProps<TData, TItem, TPagination> & {
    ref?: React.ForwardedRef<InfiniteListRef>
  }
) => React.ReactElement
