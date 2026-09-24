"use client"

import { useEffect, useRef, useState } from "react"

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * Animates a list of numbers towards `target` whenever it changes, starting
 * from wherever the previous animation had reached.
 */
export function useTween(target: number[], duration = 750): number[] {
  const [value, setValue] = useState(target)
  const current = useRef(target)
  const key = target.join(",")

  useEffect(() => {
    const from = current.current
    const to = key ? key.split(",").map(Number) : []
    const ms = reducedMotion() ? 0 : duration
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const k = ms === 0 ? 1 : ease(Math.min(1, (now - start) / ms))
      const next = to.map((v, i) => {
        const f = from[i]
        return f === undefined || !Number.isFinite(f) ? v : f + (v - f) * k
      })
      current.current = next
      setValue(next)
      if (k < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [key, duration])

  return value
}
