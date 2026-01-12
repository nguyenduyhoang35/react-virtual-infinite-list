import { useInfiniteList, useIntersectionObserver } from 'react-infinite-list'
import { fetchItemsByPage } from './mockApi'
import type { Item } from './mockApi'
import './examples.css'

export function HookExample() {
  const {
    items,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  } = useInfiniteList<{ data: Item[]; total: number; page: number; totalPages: number }, Item, { type: 'page'; limit: number }>({
    fetcher: async ({ page, limit }) => {
      console.log(`[Hook] Fetching page ${page}`)
      return fetchItemsByPage(page, limit)
    },
    pagination: { type: 'page', limit: 10 },
    getData: (res) => res.data,
    getTotal: (res) => res.total,
  })

  // Custom intersection observer for load more
  const { targetRef } = useIntersectionObserver<HTMLDivElement>({
    rootMargin: '100px',
    enabled: hasMore && !isLoading && !isLoadingMore,
    onIntersect: loadMore,
  })

  return (
    <div className="example">
      <div className="example-header">
        <h2>Hook Only (Custom Implementation)</h2>
        <p>
          Using hooks with Rick and Morty API for full control over rendering.
        </p>
        <div className="controls">
          <button onClick={refresh} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
          <span className="stats">
            Loaded: {items.length} items | Has more: {hasMore ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      <div className="list-container">
        {/* Initial loading state */}
        {isLoading && items.length === 0 && (
          <div className="loader">Loading initial data...</div>
        )}

        {/* Error state */}
        {error && (
          <div className="error">
            <p>Error: {error.message}</p>
            <button onClick={refresh}>Retry</button>
          </div>
        )}

        {/* Items */}
        <div className="items-container hook-items">
          {items.map((item, index) => (
            <div key={item.id} className="item-card hook-card">
              <div className="item-badge">{index + 1}</div>
              <img src={item.avatar} alt={item.title} className="avatar" />
              <div className="item-content">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Load more sentinel */}
        <div ref={targetRef} style={{ height: 1 }} />

        {/* Loading more */}
        {isLoadingMore && (
          <div className="loader">
            <div className="spinner"></div>
            Loading more...
          </div>
        )}

        {/* End message */}
        {!hasMore && items.length > 0 && (
          <div className="end-message">
            All {items.length} items loaded!
          </div>
        )}
      </div>
    </div>
  )
}
