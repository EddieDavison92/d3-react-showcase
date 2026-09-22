import { familyOf, geoLabel, metricLabel } from "@/lib/explorer/catalogue"
import type { ExplorerState, MetricId } from "@/lib/explorer/types"

export function ContextChip({
  state,
  areaName,
  mapMetric,
}: {
  state: ExplorerState
  areaName?: string | null
  mapMetric?: MetricId
}) {
  const paintMetric = mapMetric ?? state.metric
  const bits = [
    metricLabel(paintMetric),
    geoLabel(state.geo),
    state.year.replace(" to ", "–"),
  ]
  if (state.view === "sexgap") bits.push("Male−Female (derived)")
  else bits.push(state.sex)
  if (familyOf(paintMetric) === "le") {
    bits.push(state.age === "65" ? "at 65" : "at birth")
  }
  if (familyOf(state.metric) === "deprivation") bits.push("deprivation strip")
  if (areaName) bits.push(areaName)

  return (
    <div className="flex flex-wrap gap-1">
      {bits.map((bit) => (
        <span
          key={bit}
          className="rounded-full border bg-background/90 px-2.5 py-1 text-[11px] leading-tight text-muted-foreground"
        >
          {bit}
        </span>
      ))}
    </div>
  )
}
