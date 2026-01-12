import { ReactNode, CSSProperties } from 'react'

// ============ Pagination Types ============
export type PagePagination = {
  type: 'page'
  initialPage?: number
  limit?: number
}

export type CursorPagination = {
  type: 'cursor'
  initialCursor?: string | null
  limit?: number
}

export type PaginationType = PagePagination | CursorPagination

// ============ Fetcher Types ============
export type PageFetcherParams = {
  page: number
  limit: number
}

export type CursorFetcherParams = {
  cursor: string | null
  limit: number
}

export type FetcherParams<T extends PaginationType> = T extends PagePagination
  ? PageFetcherParams
  : CursorFetcherParams

export type Fetcher<TData, TPagination extends PaginationType> = (
  params: FetcherParams<TPagination>
) => Promise<TData>

// ============ Hook Options ============
export interface UseInfiniteListOptions<TData, TItem, TPagination extends PaginationType> {
  fetcher: Fetcher<TData, TPagination>
  pagination: TPagination
  getData: (response: TData) => TItem[]
  getTotal?: (response: TData) => number
  getNextCursor?: (response: TData) => string | null
  hasMore?: (response: TData, items: TItem[]) => boolean
  enabled?: boolean
  onSuccess?: (data: TData, items: TItem[]) => void
  onError?: (error: Error) => void
}

export interface LoadResult {
  itemsCount: number
  hasMore: boolean
}

export interface UseInfiniteListReturn<TItem> {
  items: TItem[]
  isLoading: boolean
  isLoadingMore: boolean
  error: Error | null
  hasMore: boolean
  loadMore: () => Promise<LoadResult>
  loadUntilCount: (targetCount: number, maxAttempts?: number) => Promise<LoadResult>
  reset: () => void
  refresh: () => Promise<void>
}

// ============ Virtual List Types ============
export interface VirtualListOptions {
  itemHeight: number | ((index: number) => number)
  overscan?: number
  containerHeight?: number
  useWindowScroll?: boolean // Use window scroll instead of fixed container
}

export interface UseVirtualListOptions<TItem> {
  items: TItem[]
  itemHeight: number | ((index: number) => number)
  overscan?: number
}

export interface VirtualItem {
  index: number
  start: number
  end: number
  size: number
}

export interface UseVirtualListReturn {
  virtualItems: VirtualItem[]
  totalHeight: number
  containerRef: React.RefObject<HTMLDivElement>
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void
}

// ============ Layout Types ============
export type LayoutType = 'list' | 'grid'

export interface GridOptions {
  columns?: number | 'auto-fill' | 'auto-fit'
  minItemWidth?: number
  gap?: number | string
  rowGap?: number | string
  columnGap?: number | string
}

// ============ Component Props ============
export interface InfiniteListProps<TData, TItem, TPagination extends PaginationType> {
  fetcher: Fetcher<TData, TPagination>
  pagination: TPagination
  getData: (response: TData) => TItem[]
  getTotal?: (response: TData) => number
  getNextCursor?: (response: TData) => string | null
  hasMore?: (response: TData, items: TItem[]) => boolean

  // Render
  children: (item: TItem, index: number) => ReactNode
  keyExtractor?: (item: TItem, index: number) => string | number

  // Layout
  layout?: LayoutType
  grid?: GridOptions

  // Virtual list
  virtualized?: VirtualListOptions

  // UI customization
  loader?: ReactNode
  endMessage?: ReactNode
  errorMessage?: ReactNode | ((error: Error, retry: () => void) => ReactNode)
  emptyMessage?: ReactNode

  // Scroll behavior
  threshold?: number
  reverse?: boolean

  // Container styling
  className?: string
  style?: CSSProperties
  containerClassName?: string
  containerStyle?: CSSProperties

  // Callbacks
  onLoadMore?: () => void
  onError?: (error: Error) => void
  onSuccess?: (data: TData, items: TItem[]) => void

  // Control
  enabled?: boolean
}

// ============ Intersection Observer Types ============
export interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  root?: Element | null
  rootMargin?: string
  enabled?: boolean
  onIntersect?: () => void
}
