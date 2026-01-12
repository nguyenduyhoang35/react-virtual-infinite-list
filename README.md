# React Infinite List

A powerful, flexible infinite scroll library for React with support for pagination, cursor-based loading, virtualization, and grid layouts.

## Features

- **Page-based pagination** - Traditional pagination with page numbers and total count
- **Cursor-based pagination** - Efficient cursor/token-based pagination
- **Virtual list** - Efficiently render 10,000+ items by only rendering visible items
- **Window scroll** - Use browser window scroll instead of fixed container
- **Grid layout** - Responsive grid with auto-fill columns
- **Auto-load to index** - Jump to any index with automatic data loading
- **TypeScript** - Full type safety with generics

## Installation

```bash
npm install react-virtual-infinite-list
```

## Quick Start

```tsx
import { InfiniteList } from 'react-virtual-infinite-list'

function App() {
  return (
    <InfiniteList
      fetcher={async ({ page, limit }) => {
        const res = await fetch(`/api/items?page=${page}&limit=${limit}`)
        return res.json()
      }}
      pagination={{ type: 'page', limit: 20 }}
      getData={(res) => res.data}
      getTotal={(res) => res.total}
    >
      {(item, index) => (
        <div key={item.id}>
          {index + 1}. {item.name}
        </div>
      )}
    </InfiniteList>
  )
}
```

## Examples

### Page-based Pagination

```tsx
<InfiniteList
  fetcher={async ({ page, limit }) => {
    const res = await fetch(`/api/items?page=${page}&limit=${limit}`)
    return res.json()
  }}
  pagination={{ type: 'page', limit: 20 }}
  getData={(res) => res.data}
  getTotal={(res) => res.total}
  keyExtractor={(item) => item.id}
  loader={<div>Loading...</div>}
  endMessage={<div>No more items</div>}
  emptyMessage={<div>No items found</div>}
>
  {(item, index) => <ItemCard item={item} index={index} />}
</InfiniteList>
```

### Cursor-based Pagination

```tsx
<InfiniteList
  fetcher={async ({ cursor, limit }) => {
    const url = cursor
      ? `/api/items?cursor=${cursor}&limit=${limit}`
      : `/api/items?limit=${limit}`
    const res = await fetch(url)
    return res.json()
  }}
  pagination={{ type: 'cursor', limit: 20 }}
  getData={(res) => res.data}
  getNextCursor={(res) => res.nextCursor}
  keyExtractor={(item) => item.id}
>
  {(item) => <ItemCard item={item} />}
</InfiniteList>
```

### Virtual List (10,000+ items)

```tsx
<InfiniteList
  fetcher={fetchItems}
  pagination={{ type: 'page', limit: 100 }}
  getData={(res) => res.data}
  getTotal={(res) => res.total}
  virtualized={{
    itemHeight: 80,        // Fixed height per item (or function)
    overscan: 5,           // Extra items to render above/below viewport
    containerHeight: 500,  // Fixed container height
  }}
>
  {(item, index) => <ItemCard item={item} index={index} />}
</InfiniteList>
```

### Window Scroll (No Fixed Container)

```tsx
<InfiniteList
  fetcher={fetchItems}
  pagination={{ type: 'page', limit: 100 }}
  getData={(res) => res.data}
  getTotal={(res) => res.total}
  virtualized={{
    itemHeight: 80,
    overscan: 10,
    useWindowScroll: true,  // Use window scroll instead of container
  }}
>
  {(item, index) => <ItemCard item={item} index={index} />}
</InfiniteList>
```

### Grid Layout

```tsx
<InfiniteList
  fetcher={fetchItems}
  pagination={{ type: 'page', limit: 20 }}
  getData={(res) => res.data}
  getTotal={(res) => res.total}
  layout="grid"
  grid={{
    columns: 'auto-fill',   // or number like 3, 4
    minItemWidth: 200,      // min width for auto-fill
    gap: 16,                // gap between items
  }}
>
  {(item) => <GridCard item={item} />}
</InfiniteList>
```

### Using Ref Methods

```tsx
import { useRef } from 'react'
import { InfiniteList, InfiniteListRef } from 'react-virtual-infinite-list'

function App() {
  const listRef = useRef<InfiniteListRef>(null)

  const handleJumpTo = async (index: number) => {
    // Auto-loads data if needed, then scrolls to index
    await listRef.current?.scrollToIndexWithAutoLoad(index, 'center')
  }

  return (
    <>
      <button onClick={() => listRef.current?.refresh()}>Refresh</button>
      <button onClick={() => listRef.current?.reset()}>Reset</button>
      <button onClick={() => handleJumpTo(500)}>Jump to 500</button>

      <InfiniteList ref={listRef} {...props}>
        {(item) => <ItemCard item={item} />}
      </InfiniteList>
    </>
  )
}
```

### Using the Hook Directly

```tsx
import { useInfiniteList } from 'react-virtual-infinite-list'

function CustomList() {
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
    fetcher: async ({ page, limit }) => {
      const res = await fetch(`/api/items?page=${page}&limit=${limit}`)
      return res.json()
    },
    pagination: { type: 'page', limit: 20 },
    getData: (res) => res.data,
    getTotal: (res) => res.total,
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {items.map((item, index) => (
        <ItemCard key={item.id} item={item} index={index} />
      ))}
      {isLoadingMore && <div>Loading more...</div>}
      {hasMore && <button onClick={loadMore}>Load More</button>}
    </div>
  )
}
```

## API Reference

### InfiniteListProps

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `fetcher` | `(params) => Promise<TData>` | Yes | Function to fetch data |
| `pagination` | `PagePagination \| CursorPagination` | Yes | Pagination configuration |
| `getData` | `(response: TData) => TItem[]` | Yes | Extract items array from response |
| `getTotal` | `(response: TData) => number` | No | Get total count (page pagination) |
| `getNextCursor` | `(response: TData) => string \| null` | No | Get next cursor (cursor pagination) |
| `hasMore` | `(response, items) => boolean` | No | Custom hasMore logic |
| `children` | `(item: TItem, index: number) => ReactNode` | Yes | Render function for each item |
| `keyExtractor` | `(item: TItem, index: number) => string \| number` | No | Extract unique key |
| `layout` | `'list' \| 'grid'` | No | Layout mode (default: 'list') |
| `grid` | `GridOptions` | No | Grid configuration |
| `virtualized` | `VirtualListOptions` | No | Virtual list configuration |
| `loader` | `ReactNode` | No | Loading indicator |
| `endMessage` | `ReactNode` | No | End of list message |
| `errorMessage` | `ReactNode \| ((error, retry) => ReactNode)` | No | Error display |
| `emptyMessage` | `ReactNode` | No | Empty state |
| `threshold` | `number` | No | Load more threshold in pixels (default: 200) |
| `reverse` | `boolean` | No | Reverse scroll direction |
| `className` | `string` | No | Container class |
| `style` | `CSSProperties` | No | Container style |
| `containerClassName` | `string` | No | Items container class |
| `containerStyle` | `CSSProperties` | No | Items container style |
| `onLoadMore` | `() => void` | No | Callback when loading more |
| `onError` | `(error: Error) => void` | No | Error callback |
| `onSuccess` | `(data, items) => void` | No | Success callback |
| `enabled` | `boolean` | No | Enable/disable fetching (default: true) |

### Pagination Types

```tsx
// Page-based pagination
type PagePagination = {
  type: 'page'
  initialPage?: number  // default: 1
  limit?: number        // default: 20
}

// Cursor-based pagination
type CursorPagination = {
  type: 'cursor'
  initialCursor?: string | null
  limit?: number        // default: 20
}
```

### GridOptions

```tsx
type GridOptions = {
  columns?: number | 'auto-fill' | 'auto-fit'  // default: 'auto-fill'
  minItemWidth?: number   // default: 200
  gap?: number | string   // default: 16
  rowGap?: number | string
  columnGap?: number | string
}
```

### VirtualListOptions

```tsx
type VirtualListOptions = {
  itemHeight: number | ((index: number) => number)  // Required
  overscan?: number          // Extra items to render (default: 5)
  containerHeight?: number   // Fixed height (required if not useWindowScroll)
  useWindowScroll?: boolean  // Use window scroll (default: false)
}
```

### InfiniteListRef

```tsx
type InfiniteListRef = {
  reset: () => void
  refresh: () => Promise<void>
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void
  scrollToIndexWithAutoLoad: (index: number, align?: 'start' | 'center' | 'end') => Promise<void>
  getLoadedCount: () => number
}
```

### useInfiniteList Return

```tsx
type UseInfiniteListReturn<TItem> = {
  items: TItem[]
  isLoading: boolean
  isLoadingMore: boolean
  error: Error | null
  hasMore: boolean
  loadMore: () => Promise<LoadResult>
  loadUntilCount: (targetCount: number) => Promise<LoadResult>
  reset: () => void
  refresh: () => Promise<void>
}

type LoadResult = {
  itemsCount: number
  hasMore: boolean
}
```

## Hooks

### useInfiniteList

Core hook for infinite list logic.

```tsx
const result = useInfiniteList({
  fetcher,
  pagination,
  getData,
  getTotal,
  getNextCursor,
  hasMore,
  enabled,
  onSuccess,
  onError,
})
```

### useVirtualList

Hook for virtual scrolling (used internally).

```tsx
const { virtualItems, totalHeight, containerRef, scrollToIndex } = useVirtualList({
  items,
  itemHeight,
  overscan,
  onNearEnd,
  nearEndThreshold,
  useWindowScroll,
})
```

### useIntersectionObserver

Hook for intersection observer (used internally for non-virtual infinite scroll).

```tsx
const { targetRef, isIntersecting } = useIntersectionObserver({
  threshold,
  root,
  rootMargin,
  enabled,
  onIntersect,
})
```

## License

MIT
