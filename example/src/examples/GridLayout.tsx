import { useRef } from 'react'
import { InfiniteList } from 'react-infinite-list'
import type { InfiniteListRef } from 'react-infinite-list'
import { fetchItemsByPage } from './mockApi'
import type { Item } from './mockApi'
import './examples.css'

export function GridLayoutExample() {
  const listRef = useRef<InfiniteListRef>(null)

  return (
    <div className="example">
      <div className="example-header">
        <h2>Grid Layout</h2>
        <p>Rick and Morty characters displayed in a responsive grid.</p>
        <button onClick={() => listRef.current?.refresh()}>Refresh</button>
      </div>

      <div className="list-container">
        <InfiniteList
          ref={listRef}
          fetcher={async ({ page, limit }) => {
            console.log(`Fetching page ${page} for grid`)
            return fetchItemsByPage(page, limit)
          }}
          pagination={{ type: 'page', limit: 20 }}
          getData={(res) => res.data}
          getTotal={(res) => res.total}
          keyExtractor={(item) => item.id}
          layout="grid"
          grid={{
            columns: 'auto-fill',
            minItemWidth: 180,
            gap: 16,
          }}
          loader={<div className="loader grid-loader">Loading...</div>}
          endMessage={<div className="end-message">All characters loaded!</div>}
          containerClassName="grid-container"
        >
          {(item: Item) => (
            <div className="grid-card">
              <img src={item.avatar} alt={item.title} className="grid-avatar" />
              <div className="grid-content">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </div>
          )}
        </InfiniteList>
      </div>
    </div>
  )
}
