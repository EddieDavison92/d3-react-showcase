import { familyOf, geoShort } from "@/lib/explorer/catalogue"
import { compactPeriod } from "@/lib/explorer/format"
import type { ExplorerState, MetricId } from "@/lib/explorer/types"
import { SEX_GAP_LABEL } from "@/lib/explorer/views"

export function ContextChip({
  state,
  mapMetric,
  nationName,
}: {
  state: ExplorerState
  mapMetric?: MetricId
  nationName?: string | null
}) {
  const paintMetric = mapMetric ?? state.metric
  const bits = [geoShort(state.geo), compactPeriod(state.year)]
  if (state.view === "sex_gap") bits.push(SEX_GAP_LABEL)
  else bits.push(state.sex)
  if (familyOf(paintMetric) === "le") {
    bits.push(state.age === "65" ? "At 65" : "At birth")
  }
  if (state.view === "vs_nation") bits.push(nationName ? `vs ${nationName}` : "vs own nation")
  if (familyOf(state.metric) === "deprivation") bits.push("deprivation strip")

  return (
    <div className="flex flex-wrap gap-1">
      {bits.map((bit) => (
        <span
          key={bit}
          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] leading-tight text-muted-foreground"
        >
          {bit}
        </span>
      ))}
    </div>
  )
}
