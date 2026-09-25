"use client"

import { useEffect, useRef, useState } from "react"

/** Tracks an element's content box. `measured` turns true after the first real measurement. */
export function useSize<T extends HTMLElement>(initial = { width: 640, height: 480 }) {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState({ ...initial, measured: false })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width <= 0 || height <= 0) return
      const next = { width: Math.round(width), height: Math.round(height), measured: true }
      setSize((prev) => (prev.measured && prev.width === next.width && prev.height === next.height ? prev : next))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, size] as const
}
