/** Teal sequential for Absolute only. Diverging warm slate ↔ teal for Δ / gap / relative. */

export const TEAL_RAMP = [
  "#f0fdfa",
  "#99f6e4",
  "#5eead4",
  "#2dd4bf",
  "#14b8a6",
  "#0f766e",
  "#134e4a",
  "#042f2e",
] as const

export const AVOIDABLE_RAMP = [
  "#fff7ed",
  "#ffedd5",
  "#fed7aa",
  "#fdba74",
  "#fb923c",
  "#f97316",
  "#ea580c",
  "#c2410c",
  "#9a3412",
] as const

export const DIVERGING_RAMP = [
  "#334155",
  "#475569",
  "#64748b",
  "#94a3b8",
  "#e2e8f0",
  "#e9e7e2",
  "#99f6e4",
  "#5eead4",
  "#14b8a6",
  "#0f766e",
  "#115e59",
] as const

export const DIVERGING_RAMP_REVERSED = [...DIVERGING_RAMP].reverse()

export const NO_DATA = "#e2e8f0"

export function interpolateRamp(
  ramp: readonly string[],
  t: number
): string {
  const x = Math.max(0, Math.min(1, t))
  const scaled = x * (ramp.length - 1)
  const i = Math.floor(scaled)
  const f = scaled - i
  if (i >= ramp.length - 1) return ramp[ramp.length - 1]
  return mixColour(ramp[i], ramp[i + 1], f)
}

export type Rgb = [number, number, number]

export function toRgb(hex: string): Rgb {
  return parseColour(hex)
}

export function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]
}

export function rgbToHex(rgb: Rgb): string {
  return `#${toHex(Math.round(rgb[0]))}${toHex(Math.round(rgb[1]))}${toHex(Math.round(rgb[2]))}`
}

export function mixColour(a: string, b: string, t: number): string {
  return rgbToHex(mixRgb(toRgb(a), toRgb(b), t))
}

export function rgbLookup(colours: Record<string, string>): Record<string, Rgb> {
  const out: Record<string, Rgb> = {}
  for (const key of Object.keys(colours)) out[key] = toRgb(colours[key] ?? NO_DATA)
  return out
}

function toHex(n: number): string {
  return n.toString(16).padStart(2, "0")
}

function parseColour(hex: string): [number, number, number] {
  const rgb = hex.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  const h = hex.replace("#", "")
  if (h.length < 6) return [226, 232, 240]
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

export function motionMs(ms: number): number {
  if (typeof window === "undefined") return ms
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms
}

export function linearT(value: number, min: number, max: number): number {
  if (!Number.isFinite(value) || max === min) return 0.5
  return (value - min) / (max - min)
}
