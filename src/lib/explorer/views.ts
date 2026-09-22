import { familyOf } from "./catalogue"
import type { MetricId, ViewId } from "./types"

export const SEX_GAP_LABEL = "Male − Female (derived)"

export const VIEW_OPTIONS: {
  id: ViewId
  label: string
  shortLabel: string
  aria: string
}[] = [
  { id: "absolute", label: "Absolute", shortLabel: "Absolute", aria: "Absolute life expectancy" },
  { id: "d2017", label: "Δ 2017–19", shortLabel: "Δ17–19", aria: "Change vs 2017–19 (pre-COVID)" },
  { id: "d2019", label: "Δ 2019–21", shortLabel: "Δ19–21", aria: "Change vs 2019–21 (trough)" },
  { id: "vs_nation", label: "vs nation", shortLabel: "vs nation", aria: "Area minus own nation comparator" },
  { id: "sex_gap", label: "Sex gap", shortLabel: "Sex gap", aria: "Male minus Female (derived)" },
  { id: "ci", label: "CI focus", shortLabel: "CI", aria: "Emphasise uncertainty on map + series" },
]

const VIEW_SET = new Set<string>(VIEW_OPTIONS.map((option) => option.id))

const VIEW_ALIASES: Record<string, ViewId> = {
  abs: "absolute",
  absolute: "absolute",
  delta: "d2017",
  d1719: "d2017",
  d2017: "d2017",
  d1921: "d2019",
  d2019: "d2019",
  nation: "vs_nation",
  vs_nation: "vs_nation",
  sexgap: "sex_gap",
  sex_gap: "sex_gap",
  ci: "ci",
}

export const PERIOD_PRECOVID = "2017 to 2019"
export const PERIOD_TROUGH = "2019 to 2021"

export function parseView(raw: string | null): ViewId | undefined {
  if (!raw) return undefined
  if (VIEW_ALIASES[raw]) return VIEW_ALIASES[raw]
  if (VIEW_SET.has(raw)) return raw as ViewId
  return undefined
}

export function viewsFor(metric: MetricId): ViewId[] {
  const family = familyOf(metric)
  if (family === "deprivation") return []
  if (family === "avoidable") {
    return ["absolute", "d2017", "d2019", "vs_nation", "ci"]
  }
  return VIEW_OPTIONS.map((option) => option.id)
}

export function isDivergingView(view: ViewId): boolean {
  return view === "d2017" || view === "d2019" || view === "vs_nation" || view === "sex_gap"
}

export function viewNote(view: ViewId): string {
  switch (view) {
    case "absolute":
      return "Latest period levels. Not the only story — try change, vs nation, or the sex gap."
    case "d2017":
      return "Change since 2017–19 (pre-pandemic). Missing baselines stay uncoloured."
    case "d2019":
      return "Change since 2019–21 (pandemic trough). A rise from the trough is not full recovery."
    case "vs_nation":
      return "Area minus its own nation comparator (named in the legend when an area is selected)."
    case "sex_gap":
      return `${SEX_GAP_LABEL}. Not an ONS persons estimate — local files have no persons LE.`
    case "ci":
      return "Same Absolute fill. Wider CI = less certain."
  }
}

export function legendCaption(
  view: ViewId,
  unit: string,
  opts?: { nationName?: string | null }
): string {
  const deltaUnit = unit === "years" ? "Δ years" : `Δ ${unit}`
  switch (view) {
    case "d2017":
    case "d2019":
      return deltaUnit
    case "vs_nation":
      return opts?.nationName ? `vs ${opts.nationName} (${unit})` : `vs nation (${unit})`
    case "sex_gap":
      return `M − F (${unit})`
    default:
      return unit
  }
}
