import { useRef, useState } from 'react'
import { InfiniteList } from 'react-infinite-list'
import type { InfiniteListRef } from 'react-infinite-list'
import { fetchLargeDataset } from './mockApi'
import type { Item } from './mockApi'
import './examples.css'

export function WindowScrollListExample() {
  const listRef = useRef<InfiniteListRef>(null)
  const [jumpToIndex, setJumpToIndex] = useState('')
  const [loadedCount, setLoadedCount] = useState(0)
  const [jumpError, setJumpError] = useState('')
  const [isJumping, setIsJumping] = useState(false)

  const handleJump = async () => {
    const index = parseInt(jumpToIndex, 10)
    if (isNaN(index) || index < 0) {
      setJumpError('Invalid index')
      return
    }
    if (index >= 10000) {
      setJumpError('Index must be less than 10,000')
      return
    }
    setJumpError('')
    setIsJumping(true)

    try {
      await listRef.current?.scrollToIndexWithAutoLoad(index, 'center')
    } catch {
      setJumpError('Failed to jump to index')
    } finally {
      setIsJumping(false)
    }
  }

  return (
    <div className="example">
      <div className="example-header" style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10, paddingBottom: 16, borderBottom: '1px solid #eee' }}>
        <h2>Window Scroll Virtual List</h2>
        <p>
          Uses window scroll instead of fixed container. Loaded: <strong>{loadedCount}</strong> / 10,000
        </p>
        <div className="controls">
          <button onClick={() => listRef.current?.refresh()}>
            Refresh
          </button>
          <div className="jump-control">
            <input
              type="number"
              placeholder={`Index (0-${Math.max(0, loadedCount - 1)})`}
              value={jumpToIndex}
              onChange={(e) => {
                setJumpToIndex(e.target.value)
                setJumpError('')
              }}
              min={0}
            />
            <button onClick={handleJump} disabled={isJumping}>
              {isJumping ? 'Loading...' : 'Jump to'}
            </button>
          </div>
        </div>
        {jumpError && <p className="jump-error">{jumpError}</p>}
      </div>

      <InfiniteList
        ref={listRef}
        fetcher={async ({ page, limit }) => {
          console.log(`Fetching page ${page} (window scroll)`)
          return fetchLargeDataset(page, limit)
        }}
        pagination={{ type: 'page', limit: 100 }}
        getData={(res) => res.data}
        getTotal={(res) => res.total}
        keyExtractor={(item) => item.id}
        virtualized={{
          itemHeight: 80,
          overscan: 10,
          useWindowScroll: true, // Use window scroll!
        }}
        loader={<div className="loader">Loading more items...</div>}
        endMessage={<div className="end-message">All 10,000 items loaded!</div>}
        containerClassName="virtual-items-container"
        onSuccess={(_data, items) => setLoadedCount(items.length)}
      >
        {(item: Item, index: number) => (
          <div className="item-card virtual-card" style={{ margin: '0 16px' }}>
            <div className="item-index">#{index + 1}</div>
            <img src={item.avatar} alt={item.title} className="avatar-small" />
            <div className="item-content">
              <h3>{item.title}</h3>
              <p className="truncate">{item.description}</p>
            </div>
          </div>
        )}
      </InfiniteList>
    </div>
  )
}
