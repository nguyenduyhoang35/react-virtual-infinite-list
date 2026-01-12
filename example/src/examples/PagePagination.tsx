import { useRef } from "react";
import { InfiniteList } from "react-infinite-list";
import type { InfiniteListRef } from "react-infinite-list";
import { fetchItemsByPage, type Item } from "./mockApi";
import "./examples.css";

export function PagePaginationExample() {
  const listRef = useRef<InfiniteListRef>(null);

  return (
    <div className="example">
      <div className="example-header">
        <h2>Page-based Pagination</h2>
        <p>
          Using Rick and Morty API - 826 characters, 20 per page.
        </p>
        <button onClick={() => listRef.current?.refresh()}>Refresh</button>
      </div>

      <div className="list-container">
        <InfiniteList
          ref={listRef}
          fetcher={async ({ page, limit }) => {
            console.log(`Fetching page ${page} with limit ${limit}`);
            return fetchItemsByPage(page, limit);
          }}
          pagination={{ type: "page", limit: 20 }}
          getData={(res) => res.data}
          getTotal={(res) => res.total}
          keyExtractor={(item) => item.id}
          loader={<div className="loader">Loading...</div>}
          endMessage={
            <div className="end-message">You've reached the end!</div>
          }
          emptyMessage={<div className="empty">No items found</div>}
          errorMessage={(error, retry) => (
            <div className="error">
              <p>Error: {error.message}</p>
              <button onClick={retry}>Retry</button>
            </div>
          )}
          containerClassName="items-container"
        >
          {(item: Item) => (
            <div className="item-card">
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
  );
}
