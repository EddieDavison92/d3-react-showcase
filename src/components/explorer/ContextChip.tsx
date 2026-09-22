import { familyOf, geoLabel, metricLabel } from "@/lib/explorer/catalogue"
import type { ExplorerState, MetricId } from "@/lib/explorer/types"
import { SEX_GAP_LABEL } from "@/lib/explorer/views"

export function ContextChip({
  state,
  areaName,
  mapMetric,
  nationName,
}: {
  state: ExplorerState
  areaName?: string | null
  mapMetric?: MetricId
  nationName?: string | null
}) {
  const paintMetric = mapMetric ?? state.metric
  const bits = [
    metricLabel(paintMetric),
    geoLabel(state.geo),
    state.year.replace(" to ", "–"),
  ]
  if (state.view === "sex_gap") bits.push(SEX_GAP_LABEL)
  else bits.push(state.sex)
  if (state.view === "vs_nation") bits.push(nationName ? `vs ${nationName}` : "vs own nation")
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
