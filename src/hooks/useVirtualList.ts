import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { UseVirtualListOptions, UseVirtualListReturn, VirtualItem } from '../types'

export interface UseVirtualListOptionsExtended<TItem> extends UseVirtualListOptions<TItem> {
  onNearEnd?: () => void
  nearEndThreshold?: number
  useWindowScroll?: boolean // Use window as scroll container instead of fixed height container
}

export function useVirtualList<TItem>(
  options: UseVirtualListOptionsExtended<TItem>
): UseVirtualListReturn {
  const { items, itemHeight, overscan = 3, onNearEnd, nearEndThreshold = 200, useWindowScroll = false } = options

  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const [containerOffset, setContainerOffset] = useState(0) // Offset of container from top of page

  // Calculate item heights
  const getItemHeight = useCallback(
    (index: number) => {
      if (typeof itemHeight === 'function') {
        return itemHeight(index)
      }
      return itemHeight
    },
    [itemHeight]
  )

  // Calculate total height and item positions
  const { totalHeight, itemPositions } = useMemo(() => {
    const positions: { start: number; end: number; size: number }[] = []
    let currentOffset = 0

    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(i)
      positions.push({
        start: currentOffset,
        end: currentOffset + height,
        size: height,
      })
      currentOffset += height
    }

    return {
      totalHeight: currentOffset,
      itemPositions: positions,
    }
  }, [items.length, getItemHeight])

  // Find visible range using binary search
  const findStartIndex = useCallback(
    (scrollTop: number) => {
      let low = 0
      let high = itemPositions.length - 1

      while (low <= high) {
        const mid = Math.floor((low + high) / 2)
        const pos = itemPositions[mid]

        if (!pos) break

        if (pos.end < scrollTop) {
          low = mid + 1
        } else if (pos.start > scrollTop) {
          high = mid - 1
        } else {
          return mid
        }
      }

      return Math.max(0, low)
    },
    [itemPositions]
  )

  const findEndIndex = useCallback(
    (scrollTop: number, containerHeight: number) => {
      const targetEnd = scrollTop + containerHeight

      let low = 0
      let high = itemPositions.length - 1

      while (low <= high) {
        const mid = Math.floor((low + high) / 2)
        const pos = itemPositions[mid]

        if (!pos) break

        if (pos.start > targetEnd) {
          high = mid - 1
        } else if (pos.end < targetEnd) {
          low = mid + 1
        } else {
          return mid
        }
      }

      return Math.min(itemPositions.length - 1, low)
    },
    [itemPositions]
  )

  // Calculate virtual items
  const virtualItems = useMemo((): VirtualItem[] => {
    if (items.length === 0 || containerHeight === 0) {
      return []
    }

    const startIndex = Math.max(0, findStartIndex(scrollTop) - overscan)
    const endIndex = Math.min(
      items.length - 1,
      findEndIndex(scrollTop, containerHeight) + overscan
    )

    const result: VirtualItem[] = []

    for (let i = startIndex; i <= endIndex; i++) {
      const pos = itemPositions[i]
      if (pos) {
        result.push({
          index: i,
          start: pos.start,
          end: pos.end,
          size: pos.size,
        })
      }
    }

    return result
  }, [
    items.length,
    containerHeight,
    scrollTop,
    overscan,
    findStartIndex,
    findEndIndex,
    itemPositions,
  ])

  // Scroll to specific index
  const scrollToIndex = useCallback(
    (index: number, align: 'start' | 'center' | 'end' = 'start') => {
      const container = containerRef.current
      if (!container || index < 0 || index >= items.length) return

      const pos = itemPositions[index]
      if (!pos) return

      let targetScrollTop: number

      switch (align) {
        case 'start':
          targetScrollTop = pos.start
          break
        case 'center':
          targetScrollTop = pos.start - containerHeight / 2 + pos.size / 2
          break
        case 'end':
          targetScrollTop = pos.end - containerHeight
          break
        default:
          targetScrollTop = pos.start
      }

      if (useWindowScroll) {
        // Window scroll mode - scroll to position relative to container's position on page
        const rect = container.getBoundingClientRect()
        const containerTop = window.scrollY + rect.top
        window.scrollTo({
          top: containerTop + Math.max(0, targetScrollTop),
          behavior: 'smooth',
        })
      } else {
        container.scrollTop = Math.max(0, targetScrollTop)
      }
    },
    [items.length, itemPositions, containerHeight, useWindowScroll]
  )

  // Handle scroll events
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (useWindowScroll) {
      // Window scroll mode
      const handleWindowScroll = () => {
        const rect = container.getBoundingClientRect()
        const windowScrollTop = window.scrollY
        const containerTop = windowScrollTop + rect.top

        // Calculate scroll position relative to container
        const relativeScrollTop = Math.max(0, windowScrollTop - containerTop)
        setScrollTop(relativeScrollTop)
        setContainerOffset(containerTop)

        // Check if near end for load more
        if (onNearEnd) {
          const documentHeight = document.documentElement.scrollHeight
          const windowHeight = window.innerHeight
          const distanceFromBottom = documentHeight - windowScrollTop - windowHeight

          if (distanceFromBottom < nearEndThreshold) {
            onNearEnd()
          }
        }
      }

      window.addEventListener('scroll', handleWindowScroll, { passive: true })
      handleWindowScroll() // Initial call

      return () => {
        window.removeEventListener('scroll', handleWindowScroll)
      }
    } else {
      // Container scroll mode
      const handleScroll = () => {
        const newScrollTop = container.scrollTop
        setScrollTop(newScrollTop)

        // Check if near end for load more
        if (onNearEnd) {
          const scrollHeight = container.scrollHeight
          const clientHeight = container.clientHeight
          const distanceFromBottom = scrollHeight - newScrollTop - clientHeight

          if (distanceFromBottom < nearEndThreshold) {
            onNearEnd()
          }
        }
      }

      container.addEventListener('scroll', handleScroll, { passive: true })

      return () => {
        container.removeEventListener('scroll', handleScroll)
      }
    }
  }, [onNearEnd, nearEndThreshold, useWindowScroll])

  // Handle resize - re-run when items change (container might mount/unmount)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (useWindowScroll) {
      // Window scroll mode - use window height as container height
      const handleResize = () => {
        setContainerHeight(window.innerHeight)
      }

      window.addEventListener('resize', handleResize, { passive: true })
      handleResize() // Initial call

      return () => {
        window.removeEventListener('resize', handleResize)
      }
    } else {
      // Container scroll mode
      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (entry) {
          setContainerHeight(entry.contentRect.height)
        }
      })

      resizeObserver.observe(container)
      // Set initial height
      setContainerHeight(container.clientHeight)

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [items.length, useWindowScroll]) // Re-run when items load

  return {
    virtualItems,
    totalHeight,
    containerRef,
    scrollToIndex,
  }
}
