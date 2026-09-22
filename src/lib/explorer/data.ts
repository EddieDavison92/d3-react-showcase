import type {
  AreaRecord,
  DeprivationFile,
  LookupsFile,
  MetricId,
  PackedFile,
  PackedPoint,
} from "./types"
import { familyOf } from "./catalogue"

const cache = new Map<string, Promise<unknown>>()

function loadJson<T>(url: string): Promise<T> {
  const hit = cache.get(url)
  if (hit) return hit as Promise<T>
  const pending = fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Failed to load ${url}`)
    return res.json() as Promise<T>
  })
  cache.set(url, pending)
  pending.catch(() => {
    cache.delete(url)
  })
  return pending
}

export function loadLe(): Promise<PackedFile> {
  return loadJson("/data/le.json")
}

export function loadHle(): Promise<PackedFile> {
  return loadJson("/data/hle.json")
}

export function loadAvoidable(): Promise<PackedFile> {
  return loadJson("/data/avoidable.json")
}

export function loadDeprivation(): Promise<DeprivationFile> {
  return loadJson("/data/deprivation.json")
}

export function loadLookups(): Promise<LookupsFile> {
  return loadJson("/data/lookups.json")
}

export async function loadMetricFile(metric: MetricId): Promise<PackedFile | null> {
  const family = familyOf(metric)
  if (family === "le") return loadLe()
  if (family === "hle") return loadHle()
  if (family === "avoidable") return loadAvoidable()
  return null
}

export function dimKey(metric: MetricId, age: string): string {
  const family = familyOf(metric)
  if (family === "avoidable") {
    if (metric === "preventable") return "preventable"
    if (metric === "treatable") return "treatable"
    return "avoidable"
  }
  if (family === "hle") return "birth"
  return age
}

export function readPoint(
  file: PackedFile,
  code: string,
  sex: string,
  dim: string,
  periodIndex: number
): PackedPoint | null {
  const series = file.values[code]?.[sex]?.[dim]
  if (!series || periodIndex < 0 || periodIndex >= series.length) return null
  return series[periodIndex]
}

export function readSeries(
  file: PackedFile,
  code: string,
  sex: string,
  dim: string
): PackedPoint[] | null {
  return file.values[code]?.[sex]?.[dim] ?? null
}

export function areasForGeo(file: PackedFile, geo: string, metric: MetricId): AreaRecord[] {
  const family = familyOf(metric)
  return file.areas.filter((area) => {
    if (family === "avoidable" && (area.nation === "S" || area.nation === "N")) return false
    if (geo === "ltla") return area.grain === "ltla"
    if (geo === "counties") return area.grain === "counties"
    if (geo === "region") return area.grain === "region"
    if (geo === "country") return area.grain === "country"
    if (geo === "utla") {
      return (
        area.areaType === "Local Areas" &&
        !area.code.startsWith("E07") &&
        area.grain !== "region" &&
        area.grain !== "country"
      )
    }
    return false
  })
}

export function geoUrl(geo: string): string {
  if (geo === "counties") return "/geo/counties.geojson"
  if (geo === "utla") return "/geo/utla.geojson"
  if (geo === "region") return "/geo/regions.geojson"
  return "/geo/ltla.geojson"
}

export function indexAreas(files: PackedFile[]): Map<string, AreaRecord> {
  const map = new Map<string, AreaRecord>()
  for (const file of files) {
    for (const area of file.areas) {
      if (!map.has(area.code)) map.set(area.code, area)
    }
  }
  return map
}
