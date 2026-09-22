import type { ViewId } from "./types"

export const VIEW_OPTIONS: {
  id: ViewId
  label: string
  shortLabel: string
}[] = [
  { id: "abs", label: "Absolute", shortLabel: "Absolute" },
  { id: "d1719", label: "Δ 2017–19", shortLabel: "Δ 17–19" },
  { id: "d1921", label: "Δ 2019–21", shortLabel: "Δ 19–21" },
  { id: "nation", label: "vs nation", shortLabel: "vs nation" },
  { id: "sexgap", label: "Sex gap", shortLabel: "Sex gap" },
  { id: "ci", label: "CI focus", shortLabel: "CI" },
]

const VIEW_SET = new Set<string>(VIEW_OPTIONS.map((option) => option.id))

export const PERIOD_PRECOVID = "2017 to 2019"
export const PERIOD_TROUGH = "2019 to 2021"

export function parseView(raw: string | null): ViewId | undefined {
  if (!raw) return undefined
  if (raw === "delta") return "d1719"
  if (VIEW_SET.has(raw)) return raw as ViewId
  return undefined
}

export function isDivergingView(view: ViewId): boolean {
  return view === "d1719" || view === "d1921" || view === "nation" || view === "sexgap"
}

export function viewNote(view: ViewId): string {
  switch (view) {
    case "abs":
      return "Latest period levels. Not the only story — try change, vs nation, or the sex gap."
    case "d1719":
      return "Change since 2017–19 (pre-pandemic). A rise from the trough is not the same as recovery."
    case "d1921":
      return "Change since 2019–21 (pandemic trough). Most areas rose; that is not full recovery."
    case "nation":
      return "Area minus its own nation (UK shown in the focus panel when published)."
    case "sexgap":
      return "Male minus female (derived). Not an ONS persons estimate — local files have no persons LE."
    case "ci":
      return "Map coloured by 95% CI width. Hatched areas are the widest intervals in this cut."
  }
}

export function legendCaption(view: ViewId, unit: string): string {
  switch (view) {
    case "d1719":
      return `Δ vs 2017–19 (${unit})`
    case "d1921":
      return `Δ vs 2019–21 (${unit})`
    case "nation":
      return `vs own nation (${unit})`
    case "sexgap":
      return "Male−Female (derived)"
    case "ci":
      return `95% CI width (${unit})`
    default:
      return unit
  }
}
