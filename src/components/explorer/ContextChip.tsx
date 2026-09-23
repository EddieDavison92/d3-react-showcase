import { familyOf, geoShort } from "@/lib/explorer/catalogue"
import { compactPeriod } from "@/lib/explorer/format"
import type { ExplorerState, MetricId } from "@/lib/explorer/types"
import { SEX_GAP_LABEL } from "@/lib/explorer/views"
import { cn } from "@/lib/utils"

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
  // Sex/age chips repeat the toggles sitting directly above them on mobile.
  const bits: { text: string; mobile: boolean }[] = [
    { text: geoShort(state.geo), mobile: true },
    { text: compactPeriod(state.year), mobile: true },
  ]
  bits.push({ text: state.view === "sex_gap" ? SEX_GAP_LABEL : state.sex, mobile: false })
  if (familyOf(paintMetric) === "le") {
    bits.push({ text: state.age === "65" ? "At 65" : "At birth", mobile: false })
  }
  if (state.view === "vs_nation") {
    bits.push({ text: nationName ? `vs ${nationName}` : "vs own nation", mobile: true })
  }
  if (familyOf(state.metric) === "deprivation") {
    bits.push({ text: "deprivation strip", mobile: true })
  }

  return (
    <div className="flex flex-wrap gap-1">
      {bits.map((bit) => (
        <span
          key={bit.text}
          className={cn(
            "rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] leading-tight text-muted-foreground",
            !bit.mobile && "hidden lg:inline"
          )}
        >
          {bit.text}
        </span>
      ))}
    </div>
  )
}
