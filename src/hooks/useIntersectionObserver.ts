import { useEffect, useRef, useCallback, useState } from 'react'
import type { UseIntersectionObserverOptions } from '../types'

export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
) {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    enabled = true,
    onIntersect,
  } = options

  const targetRef = useRef<T>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      const intersecting = entry?.isIntersecting ?? false
      setIsIntersecting(intersecting)

      if (intersecting && onIntersect) {
        onIntersect()
      }
    },
    [onIntersect]
  )

  useEffect(() => {
    const target = targetRef.current

    if (!enabled || !target) {
      return
    }

    const observer = new IntersectionObserver(handleIntersect, {
      threshold,
      root,
      rootMargin,
    })

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [enabled, threshold, root, rootMargin, handleIntersect])

  return {
    targetRef,
    isIntersecting,
  }
}
