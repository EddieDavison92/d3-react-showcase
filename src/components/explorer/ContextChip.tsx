import { familyOf, geoLabel, metricLabel } from "@/lib/explorer/catalogue"
import type { ExplorerState } from "@/lib/explorer/types"

export function ContextChip({
  state,
  areaName,
}: {
  state: ExplorerState
  areaName?: string | null
}) {
  const bits = [
    metricLabel(state.metric),
    geoLabel(state.geo),
    familyOf(state.metric) === "deprivation"
      ? "IoD 2025 · England"
      : state.year.replace(" to ", "–"),
  ]
  if (familyOf(state.metric) !== "deprivation") bits.push(state.sex)
  if (familyOf(state.metric) === "le") {
    bits.push(state.age === "65" ? "at 65" : "at birth")
  }
  if (areaName) bits.push(areaName)

  return (
    <p className="rounded-full border bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm">
      {bits.join(" · ")}
    </p>
  )
}
