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
  // On phones the toggles, "Data & area" trigger and scrub already say geo, period,
  // sex and age — only the comparator and deprivation cues stay.
  const bits: { text: string; mobile: boolean }[] = [
    { text: geoShort(state.geo), mobile: false },
    { text: compactPeriod(state.year), mobile: false },
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

  const firstMobile = bits.findIndex((bit) => bit.mobile)

  // One quiet caption line, not pills: it names the figure without competing with it.
  return (
    <p
      className={cn(
        "flex-wrap items-baseline gap-x-1.5 text-[13px] font-medium leading-snug text-slate-700",
        firstMobile >= 0 ? "flex" : "hidden lg:flex"
      )}
    >
      {bits.map((bit, i) => (
        <span key={bit.text} className={cn("inline-flex gap-x-1.5", !bit.mobile && "hidden lg:inline-flex")}>
          {i > 0 ? (
            <span aria-hidden className={cn("text-slate-300", i === firstMobile && "hidden lg:inline")}>
              ·
            </span>
          ) : null}
          {bit.text}
        </span>
      ))}
    </p>
  )
}
