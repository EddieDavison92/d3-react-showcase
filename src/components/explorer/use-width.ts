"use client"

import { useEffect, useRef, useState } from "react"

/** Tracks an element's content width. */
export function useWidth<T extends HTMLElement>(initial = 480) {
  const ref = useRef<T | null>(null)
  const [width, setWidth] = useState(initial)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width)
      if (next > 0) setWidth(next)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}
