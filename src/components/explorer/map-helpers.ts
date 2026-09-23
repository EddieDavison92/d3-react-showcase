import type { FeatureCollection } from "geojson"
import { interpolateRamp, linearT, NO_DATA } from "@/lib/explorer/colours"
import { formatCi, formatRate, formatSigned, formatYears } from "@/lib/explorer/format"
import { SEX_GAP_LABEL } from "@/lib/explorer/views"
import type { PackedPoint } from "@/lib/explorer/types"

export function boundsOfGeojson(
  geojson: FeatureCollection
): [[number, number], [number, number]] | null {
  let minX = 180
  let minY = 90
  let maxX = -180
  let maxY = -90

  const walk = (coords: unknown) => {
    if (!Array.isArray(coords)) return
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      minX = Math.min(minX, coords[0])
      maxX = Math.max(maxX, coords[0])
      minY = Math.min(minY, coords[1])
      maxY = Math.max(maxY, coords[1])
      return
    }
    for (const item of coords) walk(item)
  }

  for (const feature of geojson.features) {
    if (feature.geometry && "coordinates" in feature.geometry) {
      walk(feature.geometry.coordinates)
    }
  }
  if (minX === 180) return null
  return [
    [minX, minY],
    [maxX, maxY],
  ]
}

export function colourLookup(
  values: Record<string, number | null>,
  ramp: readonly string[],
  diverging: boolean
): { colours: Record<string, string>; min: number; max: number } {
  const finite = Object.values(values).filter((v): v is number => v !== null && Number.isFinite(v))
  if (!finite.length) return { colours: {}, min: 0, max: 1 }
  let min = Math.min(...finite)
  let max = Math.max(...finite)
  if (diverging) {
    const abs = Math.max(Math.abs(min), Math.abs(max), 0.1)
    min = -abs
    max = abs
  }
  const colours: Record<string, string> = {}
  for (const [code, value] of Object.entries(values)) {
    if (value === null || !Number.isFinite(value)) {
      colours[code] = NO_DATA
      continue
    }
    colours[code] = interpolateRamp(ramp, linearT(value, min, max))
  }
  return { colours, min, max }
}

export function hoverText(
  name: string,
  point: PackedPoint | null,
  unit: string,
  extra?: string
): string {
  if (!point || point[0] === null) return `${name}\nNo figure in this cut`
  const ci = formatCi(point) ? `\n${formatCi(point)}` : ""
  const main = unit.includes("100,000") ? formatRate(point[0]) : formatYears(point[0])
  return `${name}\n${main} ${unit}${ci}${extra ? `\n${extra}` : ""}`
}

function pointLine(label: string, point: PackedPoint | null, unit: string): string {
  if (!point || point[0] === null) return `${label} –`
  const value = unit.includes("100,000") ? formatRate(point[0]) : formatYears(point[0])
  const ci = formatCi(point) ? ` (${formatCi(point)})` : ""
  return `${label} ${value}${ci}`
}

export function sexGapHover(
  name: string,
  male: PackedPoint | null,
  female: PackedPoint | null,
  unit: string
): string {
  const gap =
    male?.[0] !== null &&
    male?.[0] !== undefined &&
    female?.[0] !== null &&
    female?.[0] !== undefined
      ? formatSigned(male[0] - female[0])
      : "–"
  return [
    name,
    pointLine("Male", male, unit),
    pointLine("Female", female, unit),
    `${SEX_GAP_LABEL} ${gap}`,
  ].join("\n")
}
