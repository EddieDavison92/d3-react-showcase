"use client"

import { useEffect, useRef, useState } from "react"

/** True once the element has scrolled into view. */
export function useInView<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T | null>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setSeen(true)
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [seen, threshold])
  return [ref, seen] as const
}
