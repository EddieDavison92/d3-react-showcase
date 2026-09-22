import { dimKey, readPoint } from "./data"
import { formatYears } from "./format"
import type {
  AreaRecord,
  LookupsFile,
  MetricId,
  PackedFile,
  PackedPoint,
  SexId,
  ViewId,
} from "./types"
import { PERIOD_PRECOVID, PERIOD_TROUGH } from "./views"

export const NATION_COMPARATOR: Record<string, { code: string; name: string }> = {
  E: { code: "E92000001", name: "England" },
  W: { code: "W92000004", name: "Wales" },
  S: { code: "S92000003", name: "Scotland" },
  N: { code: "N92000002", name: "Northern Ireland" },
  UK: { code: "K02000001", name: "United Kingdom" },
}

export type DerivedCell = {
  value: number | null
  uncertain?: boolean
  hoverExtra?: string
}

function subtract(
  now: PackedPoint | null,
  then: PackedPoint | null
): { value: number | null; uncertain: boolean } {
  if (!now || now[0] === null || !then || then[0] === null) {
    return { value: null, uncertain: false }
  }
  const value = now[0] - then[0]
  const uncertain =
    now[1] !== null && now[2] !== null && then[1] !== null && then[2] !== null
      ? now[1] <= then[2] && then[1] <= now[2]
      : false
  return { value, uncertain }
}

export function comparatorsFor(area: AreaRecord): {
  nation: { code: string; name: string } | null
  uk: { code: string; name: string } | null
} {
  const nation = NATION_COMPARATOR[area.nation] ?? null
  const uk = NATION_COMPARATOR.UK
  const nationCmp = nation && nation.code !== area.code ? nation : null
  const ukCmp = uk.code !== area.code && uk.code !== nationCmp?.code ? uk : null
  return { nation: nationCmp, uk: ukCmp }
}

export function deriveMap(args: {
  view: ViewId
  file: PackedFile
  areas: AreaRecord[]
  metric: MetricId
  sex: SexId
  age: string
  periodIndex: number
}): Record<string, DerivedCell> {
  const { view, file, areas, metric, sex, age, periodIndex } = args
  const dim = dimKey(metric, age)
  const out: Record<string, DerivedCell> = {}
  const baseline =
    view === "d1719"
      ? file.periods.indexOf(PERIOD_PRECOVID)
      : view === "d1921"
        ? file.periods.indexOf(PERIOD_TROUGH)
        : -1

  const widths: number[] = []
  if (view === "ci") {
    for (const area of areas) {
      const point = readPoint(file, area.code, sex, dim, periodIndex)
      if (point && point[1] !== null && point[2] !== null) {
        widths.push(point[2] - point[1])
      }
    }
  }
  const hatchCut = quantile(widths, 0.75)

  for (const area of areas) {
    if (view === "d1719" || view === "d1921") {
      const now = readPoint(file, area.code, sex, dim, periodIndex)
      const then = baseline >= 0 ? readPoint(file, area.code, sex, dim, baseline) : null
      const delta = subtract(now, then)
      const label = view === "d1719" ? "2017–19" : "2019–21"
      out[area.code] = {
        value: delta.value,
        uncertain: delta.uncertain,
        hoverExtra:
          delta.value === null
            ? undefined
            : `Δ vs ${label} ${signed(delta.value)}${delta.uncertain ? " · change uncertain (CIs overlap)" : ""}`,
      }
      continue
    }

    if (view === "nation") {
      const now = readPoint(file, area.code, sex, dim, periodIndex)
      const { nation, uk } = comparatorsFor(area)
      const nationPoint = nation
        ? readPoint(file, nation.code, sex, dim, periodIndex)
        : uk
          ? readPoint(file, uk.code, sex, dim, periodIndex)
          : null
      const nationName = nation?.name ?? (uk ? uk.name : null)
      const delta = subtract(now, nationPoint)
      let extra: string | undefined
      if (delta.value !== null && nationName) {
        extra = `vs ${nationName} ${signed(delta.value)}`
        if (uk && nation) {
          const ukDelta = subtract(now, readPoint(file, uk.code, sex, dim, periodIndex))
          if (ukDelta.value !== null) extra += ` · vs UK ${signed(ukDelta.value)}`
        }
      }
      out[area.code] = { value: delta.value, hoverExtra: extra }
      continue
    }

    if (view === "sexgap") {
      const male = readPoint(file, area.code, "Male", dim, periodIndex)
      const female = readPoint(file, area.code, "Female", dim, periodIndex)
      const delta = subtract(male, female)
      out[area.code] = {
        value: delta.value,
        hoverExtra:
          delta.value === null
            ? undefined
            : `Male−Female (derived) ${signed(delta.value)} · not a persons estimate`,
      }
      continue
    }

    if (view === "ci") {
      const point = readPoint(file, area.code, sex, dim, periodIndex)
      if (!point || point[1] === null || point[2] === null) {
        out[area.code] = { value: null }
      } else {
        const width = point[2] - point[1]
        out[area.code] = {
          value: width,
          uncertain: width >= hatchCut && hatchCut > 0,
          hoverExtra: `95% CI width ${formatYears(width)}`,
        }
      }
      continue
    }

    const point = readPoint(file, area.code, sex, dim, periodIndex)
    out[area.code] = { value: point?.[0] ?? null }
  }

  return out
}

export function yearsNotInGoodHealth(args: {
  le: PackedFile | null
  hle: PackedFile | null
  lookups: LookupsFile | null
  code: string | null
  sex: SexId
  year: string
}): { years: number; grain: string } | null {
  const { le, hle, lookups, code, sex, year } = args
  if (!le || !hle || !code) return null
  const hleCode = lookups?.districtToUtla[code]?.code ?? code
  const leIndex = le.periods.indexOf(year)
  const hleIndex = hle.periods.indexOf(year)
  if (leIndex < 0 || hleIndex < 0) return null
  if (!hle.values[hleCode]) return null
  const lePoint = readPoint(le, hleCode, sex, "birth", leIndex)
  const hlePoint = readPoint(hle, hleCode, sex, "birth", hleIndex)
  if (!lePoint || lePoint[0] === null || !hlePoint || hlePoint[0] === null) return null
  const parent = lookups?.districtToUtla[code]
  const grain = parent && parent.code !== code ? parent.name : "this area"
  return { years: lePoint[0] - hlePoint[0], grain }
}

function signed(value: number): string {
  const text = formatYears(value)
  return value > 0 ? `+${text}` : text
}

function quantile(values: number[], q: number): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const i = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))
  return sorted[i]
}

export function iodDecile(rank: number, n: number): number {
  if (n <= 0) return 1
  return Math.min(10, Math.max(1, Math.ceil((rank / n) * 10)))
}
