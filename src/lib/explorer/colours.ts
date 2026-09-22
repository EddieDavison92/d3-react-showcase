/** Teal sequential for Absolute only. Diverging warm slate ↔ teal for Δ / gap / relative. */

export const TEAL_RAMP = [
  "#f0fdfa",
  "#ccfbf1",
  "#99f6e4",
  "#5eead4",
  "#2dd4bf",
  "#14b8a6",
  "#0d9488",
  "#0f766e",
  "#134e4a",
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
  "#f8fafc",
  "#99f6e4",
  "#5eead4",
  "#14b8a6",
  "#0f766e",
  "#115e59",
] as const

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
  return mixHex(ramp[i], ramp[i + 1], f)
}

function mixHex(a: string, b: string, t: number): string {
  const pa = hexToRgb(a)
  const pb = hexToRgb(b)
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t)
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t)
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t)
  return `rgb(${r}, ${g}, ${bl})`
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

export function linearT(value: number, min: number, max: number): number {
  if (!Number.isFinite(value) || max === min) return 0.5
  return (value - min) / (max - min)
}
