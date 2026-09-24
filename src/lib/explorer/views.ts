import { familyOf } from "./catalogue"
import type { MetricId, ViewId } from "./types"

export const SEX_GAP_LABEL = "Male − female"

export const VIEW_OPTIONS: {
  id: ViewId
  label: string
  shortLabel: string
  aria: string
}[] = [
  { id: "absolute", label: "Level", shortLabel: "Level", aria: "Value for the period" },
  { id: "d2017", label: "Change since 2017–19", shortLabel: "Δ 2017–19", aria: "Change since 2017–19, before COVID" },
  { id: "d2019", label: "Change since 2019–21", shortLabel: "Δ 2019–21", aria: "Change since 2019–21, the COVID trough" },
  { id: "vs_nation", label: "Gap to own nation", shortLabel: "vs nation", aria: "Difference from the area's own nation" },
  { id: "sex_gap", label: "Male − female gap", shortLabel: "Sex gap", aria: "Male minus female, in years" },
  { id: "ci", label: "Uncertainty", shortLabel: "Uncertainty", aria: "Hatch areas with the widest confidence intervals" },
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

/** Names the gap, and only claims non-significance. ONS did not publish a formal test. */
export function significanceNote(view: ViewId, nation?: string | null): string | null {
  switch (view) {
    case "d2017":
      return "Change since 2017–19 is not statistically significant — the intervals overlap."
    case "d2019":
      return "Change since 2019–21 is not statistically significant — the intervals overlap."
    case "vs_nation":
      return `The gap versus ${nation ?? "the area's own nation"} is not statistically significant — the intervals overlap.`
    case "sex_gap":
      return "The sex gap is not statistically significant — the male and female intervals overlap."
    default:
      return null
  }
}

export function legendCaption(view: ViewId, unit: string): string {
  switch (view) {
    case "d2017":
    case "d2019":
      return unit === "years" ? "Δ years" : `Δ ${unit}`
    case "sex_gap":
      return unit === "years" ? "years (M − F)" : `${unit} (M − F)`
    default:
      return unit
  }
}

export function legendEnds(
  view: ViewId,
  unit = "years"
): {
  left: string
  right: string
  leftShort?: string
  rightShort?: string
  aria: string
} {
  switch (view) {
    case "d2017":
    case "d2019":
      // A rising death rate is not a gain.
      if (unit !== "years") {
        return { left: "Fall", right: "Rise", aria: `Change in ${unit}, fall to rise` }
      }
      return { left: "Decline", right: "Gain", aria: "Change in years, decline to gain" }
    case "vs_nation":
      return {
        left: "Below own nation",
        right: "Above own nation",
        leftShort: "Below",
        rightShort: "Above",
        aria: "Difference from own nation period life expectancy in years",
      }
    case "sex_gap":
      return {
        left: "Men shorter",
        right: "Women shorter",
        aria: "Male minus female period life expectancy in years",
      }
    default:
      return { left: "Lower", right: "Higher", aria: "Lower to higher years" }
  }
}
