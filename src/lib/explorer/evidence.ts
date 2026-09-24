import type { PackedFile, SexId } from "./types"

export type IndicatorGroup = "Behaviour" | "Economy" | "Environment" | "Early deaths"

export type Indicator = {
  key: string
  id: number
  group: IndicatorGroup
  label: string
  short: string
  unit: string
  better: "low" | "high"
  decimals: number
  period: string
  url: string
}

export type EvidenceFile = {
  meta: { source: string; url: string; licence: string; fetched: string; coverage: string }
  indicators: Indicator[]
  england: Record<string, number>
  ltla: Record<string, Record<string, number>>
  utla: Record<string, Record<string, number>>
}

export type EvidenceGrain = "ltla" | "utla"

/** Early-death rates are part of life expectancy, not candidate drivers of it. */
export const OUTCOME_GROUP: IndicatorGroup = "Early deaths"

let pending: Promise<EvidenceFile> | null = null

export function loadEvidence(): Promise<EvidenceFile> {
  pending ??= fetch("/data/evidence.json").then((res) => {
    if (!res.ok) throw new Error("Failed to load evidence")
    return res.json() as Promise<EvidenceFile>
  })
  pending.catch(() => {
    pending = null
  })
  return pending
}

export type Pair = { code: string; name: string; x: number; y: number }

/** Joins a factor with life expectancy (at birth) for one sex and period. */
export function pairs(args: {
  evidence: EvidenceFile
  le: PackedFile
  grain: EvidenceGrain
  key: string
  sex: SexId
  periodIndex: number
}): Pair[] {
  const { evidence, le, grain, key, sex, periodIndex } = args
  const names = new Map(le.areas.map((area) => [area.code, area.name]))
  const out: Pair[] = []
  for (const [code, factors] of Object.entries(evidence[grain])) {
    const x = factors[key]
    const y = le.values[code]?.[sex]?.birth?.[periodIndex]?.[0]
    if (x === undefined || y === null || y === undefined) continue
    out.push({ code, name: names.get(code) ?? code, x, y })
  }
  return out
}

export type Fit = { r: number; slope: number; intercept: number; n: number }

export function fit(points: { x: number; y: number }[]): Fit | null {
  const n = points.length
  if (n < 3) return null
  let sx = 0
  let sy = 0
  for (const p of points) {
    sx += p.x
    sy += p.y
  }
  const mx = sx / n
  const my = sy / n
  let sxy = 0
  let sxx = 0
  let syy = 0
  for (const p of points) {
    sxy += (p.x - mx) * (p.y - my)
    sxx += (p.x - mx) ** 2
    syy += (p.y - my) ** 2
  }
  if (sxx === 0 || syy === 0) return null
  const slope = sxy / sxx
  return { r: sxy / Math.sqrt(sxx * syy), slope, intercept: my - slope * mx, n }
}

/** Share of areas with a lower value, 0–1. */
export function percentile(values: number[], value: number): number {
  if (values.length < 2) return 0.5
  let below = 0
  let equal = 0
  for (const v of values) {
    if (v < value) below += 1
    else if (v === value) equal += 1
  }
  return (below + Math.max(0, equal - 1) / 2) / (values.length - 1)
}

export function formatIndicator(value: number | null | undefined, indicator: Indicator): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "–"
  const text = value.toLocaleString("en-GB", {
    minimumFractionDigits: indicator.decimals,
    maximumFractionDigits: indicator.decimals,
  })
  return indicator.unit === "%" ? `${text}%` : text
}

export function unitSuffix(indicator: Indicator): string {
  if (indicator.unit === "%") return ""
  if (indicator.unit === "score") return ""
  return indicator.unit
}

export type DecileRow = { decile: number; male: number | null; female: number | null; n: number }

/**
 * Mean life expectancy at birth by IMD 2025 score tenth (1 = most deprived).
 * Unweighted mean of districts, not a population-weighted figure.
 */
export function byDeprivationTenth(
  evidence: EvidenceFile,
  le: PackedFile,
  periodIndex: number
): DecileRow[] {
  const scored = Object.entries(evidence.ltla)
    .filter(([code, f]) => f.imd !== undefined && le.values[code])
    .sort((a, b) => b[1].imd - a[1].imd)
  const rows: DecileRow[] = []
  for (let d = 0; d < 10; d += 1) {
    const slice = scored.slice(
      Math.round((d * scored.length) / 10),
      Math.round(((d + 1) * scored.length) / 10)
    )
    const mean = (sex: SexId) => {
      const vals = slice
        .map(([code]) => le.values[code]?.[sex]?.birth?.[periodIndex]?.[0])
        .filter((v): v is number => typeof v === "number")
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    }
    rows.push({ decile: d + 1, male: mean("Male"), female: mean("Female"), n: slice.length })
  }
  return rows
}
