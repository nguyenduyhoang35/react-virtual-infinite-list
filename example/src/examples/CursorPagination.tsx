import { useRef } from 'react'
import { InfiniteList } from 'react-infinite-list'
import type { InfiniteListRef } from 'react-infinite-list'
import { fetchItemsByCursor } from './mockApi'
import type { Item } from './mockApi'
import './examples.css'

export function CursorPaginationExample() {
  const listRef = useRef<InfiniteListRef>(null)

  return (
    <div className="example">
      <div className="example-header">
        <h2>Cursor-based Pagination</h2>
        <p>Using Rick and Morty API with cursor-based navigation.</p>
        <button onClick={() => listRef.current?.refresh()}>
          Refresh
        </button>
      </div>

      <div className="list-container">
        <InfiniteList
          ref={listRef}
          fetcher={async ({ cursor, limit }) => {
            console.log(`Fetching cursor ${cursor} with limit ${limit}`)
            return fetchItemsByCursor(cursor, limit)
          }}
          pagination={{ type: 'cursor', limit: 15 }}
          getData={(res) => res.data}
          getNextCursor={(res) => res.nextCursor}
          keyExtractor={(item) => item.id}
          loader={
            <div className="loader">
              <div className="spinner"></div>
              <span>Loading more...</span>
            </div>
          }
          endMessage={<div className="end-message">No more items to load</div>}
          containerClassName="items-container"
        >
          {(item: Item, index: number) => (
            <div className="item-card cursor-card">
              <div className="item-index">#{index + 1}</div>
              <img src={item.avatar} alt={item.title} className="avatar" />
              <div className="item-content">
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
