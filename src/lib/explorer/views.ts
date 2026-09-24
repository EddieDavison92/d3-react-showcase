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
  { id: "vs_nation", label: "vs nation", shortLabel: "vs nation", aria: "Difference from own nation period life expectancy in years" },
  { id: "sex_gap", label: "Sex gap", shortLabel: "Sex gap", aria: "Male minus female period life expectancy in years" },
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
      return "Period life expectancy: death rates in these years, not a forecast. Other modes name a different gap — change since 2017–19, change since 2019–21, versus the area's own nation, or male minus female."
    case "d2017":
      return "Change since 2017–19, in years — not the sex gap or the nation gap. Where the intervals overlap, that change is not statistically significant."
    case "d2019":
      return "Change since 2019–21, in years. A rise from the trough is not full recovery. Where the intervals overlap, that change is not statistically significant."
    case "vs_nation":
      return "The gap versus each area's own nation, in years — not the UK gap, and not the sex gap. Where the intervals overlap, that nation gap is not statistically significant."
    case "sex_gap":
      return "The sex gap: male minus female for this period, in years. Not a change over time. Where the intervals overlap, the sex gap is not statistically significant."
    case "ci":
      return "Confidence intervals. Wider means less certain — small populations stay noisy."
  }
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
