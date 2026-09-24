import type { GeoId } from "./types"

export type SearchableArea = {
  code: string
  name: string
  geo: GeoId
}

export type PlaceHit = SearchableArea & {
  via: "name" | "postcode" | "postcode-parent"
}

/** Common names that are not the ONS label. */
const ALIASES: Record<string, string> = {
  hull: "kingston upon hull",
  "city of hull": "kingston upon hull",
  derry: "derry city and strabane",
  londonderry: "derry city and strabane",
  "western isles": "na h eileanan siar",
  "outer hebrides": "na h eileanan siar",
  "eileanan siar": "na h eileanan siar",
}

export function normalisePlace(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[.’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

export function postcodeKind(raw: string): "full" | "outward" | null {
  const compact = raw.trim().toUpperCase().replace(/\s+/g, "")
  if (!compact || /[^A-Z0-9]/.test(compact)) return null
  if (/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(compact)) return "full"
  if (/^[A-Z]{1,2}\d[A-Z\d]?$/.test(compact)) return "outward"
  return null
}

export function searchPlaces(areas: SearchableArea[], query: string, limit = 8): PlaceHit[] {
  const q = normalisePlace(query)
  if (q.length < 2) return []
    const alias = ALIASES[q]
    const scored: { area: SearchableArea; score: number }[] = []
    for (const area of areas) {
      const name = normalisePlace(area.name)
      const aliasScore = alias ? scoreName(name, alias) : 0
      const score = Math.max(scoreName(name, q), aliasScore > 0 ? aliasScore + 5 : 0)
    const code = area.code.toLowerCase()
    const codeScore = code === q.replace(/\s/g, "") ? 92 : code.startsWith(q.replace(/\s/g, "")) ? 50 : 0
    const best = Math.max(score, codeScore)
    if (best > 0) scored.push({ area, score: best - name.length * 0.01 })
  }
  scored.sort((a, b) => b.score - a.score || a.area.name.localeCompare(b.area.name))
  return scored.slice(0, limit).map((hit) => ({ ...hit.area, via: "name" as const }))
}

function scoreName(name: string, q: string): number {
  if (!q) return 0
  if (name === q) return 100
  if (name.startsWith(q)) return 80
  if (name.split(" ").some((word) => word.startsWith(q))) return 60
  if (name.includes(q)) return 40
  return 0
}

type Redirects = Record<string, { code: string; name: string }>

/**
 * Resolves a UK postcode to areas in this explorer.
 * Uses postcodes.io in the browser. Name search does not need it.
 */
export async function lookupPostcode(
  query: string,
  areas: SearchableArea[],
  redirects: Redirects,
  signal: AbortSignal
): Promise<PlaceHit[]> {
  const kind = postcodeKind(query)
  if (!kind) return []
  const compact = query.trim().toUpperCase().replace(/\s+/g, "")
  const url =
    kind === "full"
      ? `https://api.postcodes.io/postcodes/${encodeURIComponent(compact)}`
      : `https://api.postcodes.io/outcodes/${encodeURIComponent(compact)}`
  const res = await fetch(url, { signal })
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`postcode lookup ${res.status}`)
  const body = (await res.json()) as {
    result?: {
      admin_district?: string | string[]
      codes?: { admin_district?: string }
    }
  }
  const result = body.result
  if (!result) return []
  if (kind === "full" && result.codes?.admin_district) {
    return resolveDistrict(result.codes.admin_district, result.admin_district, areas, redirects)
  }
  const names = Array.isArray(result.admin_district)
    ? result.admin_district
    : result.admin_district
      ? [result.admin_district]
      : []
  const hits: PlaceHit[] = []
  const seen = new Set<string>()
  for (const name of names) {
    for (const area of matchName(areas, name)) {
      if (seen.has(area.code)) continue
      seen.add(area.code)
      hits.push({ ...area, via: "postcode" })
    }
  }
  return hits.slice(0, 8)
}

function resolveDistrict(
  code: string,
  name: string | string[] | undefined,
  areas: SearchableArea[],
  redirects: Redirects
): PlaceHit[] {
  const direct = areas.find((area) => area.code === code)
  if (direct) return [{ ...direct, via: "postcode" }]
  const parent = redirects[code]
  if (parent) {
    const snapped = areas.find((area) => area.code === parent.code)
    if (snapped) return [{ ...snapped, via: "postcode-parent" }]
  }
  const label = Array.isArray(name) ? name[0] : name
  if (!label) return []
  return matchName(areas, label).slice(0, 1).map((area) => ({ ...area, via: "postcode" as const }))
}

function matchName(areas: SearchableArea[], name: string): SearchableArea[] {
  const key = normalisePlace(name)
  const exact = areas.filter((area) => normalisePlace(area.name) === key)
  if (exact.length) return exact
  return areas.filter((area) => normalisePlace(area.name).includes(key))
}
