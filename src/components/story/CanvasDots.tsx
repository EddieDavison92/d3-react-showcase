"use client"

import { useEffect, useRef } from "react"

export type CanvasPoint = { key: string; x: number; y: number }

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/**
 * Scatter dots drawn on a canvas laid over an SVG with the same viewBox.
 * When points change, each dot glides from where it was in one animation
 * loop, so hundreds of dots stay smooth.
 */
export function CanvasDots({
  points,
  width,
  height,
  colour,
  radius = 1.9,
  alpha = 0.4,
  duration = 750,
}: {
  points: CanvasPoint[]
  /** viewBox width and height the coordinates are in. */
  width: number
  height: number
  colour: string
  radius?: number
  alpha?: number
  duration?: number
}) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const drawn = useRef<Map<string, { x: number; y: number }>>(new Map())
  const drawnColour = useRef(colour)
  const scale = useRef(1)

  // Match the canvas bitmap to its displayed size.
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const fit = () => {
      const dpr = window.devicePixelRatio || 1
      const w = canvas.clientWidth
      if (!w) return
      scale.current = w / width
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round((w / width) * height * dpr)
      paint(canvas, drawn.current, drawnColour.current, radius, alpha, scale.current * dpr)
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [width, height, radius, alpha])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const from = new Map(drawn.current)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const ms = reduce || from.size === 0 ? 0 : duration
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const k = ms === 0 ? 1 : ease(Math.min(1, (now - start) / ms))
      const next = new Map<string, { x: number; y: number }>()
      for (const p of points) {
        const f = from.get(p.key) ?? p
        next.set(p.key, { x: f.x + (p.x - f.x) * k, y: f.y + (p.y - f.y) * k })
      }
      drawn.current = next
      // Colour switches at once: blending blue into ochre passes through grey.
      drawnColour.current = colour
      const dpr = window.devicePixelRatio || 1
      paint(canvas, next, drawnColour.current, radius, alpha, scale.current * dpr)
      if (k < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [points, colour, radius, alpha, duration])

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
}

function paint(
  canvas: HTMLCanvasElement,
  dots: Map<string, { x: number; y: number }>,
  colour: string,
  radius: number,
  alpha: number,
  scale: number
) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.globalAlpha = alpha
  ctx.fillStyle = colour
  // One fill per dot so overlaps darken, as they would in SVG.
  for (const { x, y } of dots.values()) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
}
