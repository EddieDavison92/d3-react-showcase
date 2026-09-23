import { iodDecile } from "@/lib/explorer/derive"
import type { AreaRecord, DeprivationFile } from "@/lib/explorer/types"
import { AboutNumbers } from "@/components/explorer/AboutNumbers"
import { cn } from "@/lib/utils"

const INDEX_BADGE: Record<string, string> = {
  E: "IoD 2025",
  W: "WIMD",
  S: "SIMD",
  N: "NIMDM",
}

const NATION_NAME: Record<string, string> = {
  E: "England",
  W: "Wales",
  S: "Scotland",
  N: "Northern Ireland",
}

export function DeprivationStrip({
  area,
  deprivation,
  emphasised,
}: {
  area?: AreaRecord | null
  deprivation: DeprivationFile | null
  emphasised?: boolean
}) {
  const badge = nationBadge(area?.nation)
  const pack = nationPack(deprivation, area?.nation)
  const rec = area && pack ? pack.values[area.code] : undefined
  const n = pack ? Object.keys(pack.values).length : 0
  const decile = rec ? iodDecile(rec.rankAverageScore, n) : null
  const reverseBar = pack ? !pack.higherRankIsLessDeprived : false

  return (
    <div
      className={cn(
        "rounded-md border px-2.5 py-1.5 text-[11px] leading-snug",
        emphasised ? "border-teal-700/50 bg-teal-50/60 dark:bg-teal-950/20" : "bg-muted/30"
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <span className="rounded-full border bg-background px-2 py-0.5 font-medium">
          {badge}
        </span>
        <span className="truncate font-medium">{area?.name ?? "Select an area"}</span>
        {rec && n && decile ? (
          <RankBar
            rank={rec.rankAverageScore}
            n={n}
            decile={decile}
            reverse={reverseBar}
          />
        ) : (
          <span className="text-muted-foreground">{emptyCopy(area)}</span>
        )}
      </div>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-muted-foreground">
        <span>Deprivation is context only — not a cause of life expectancy.</span>
        <AboutNumbers
          triggerVariant="ghost"
          label="About deprivation indices"
          triggerClassName="h-auto min-h-0 px-0 sm:h-auto sm:min-h-0 sm:px-0 text-[11px] font-normal text-muted-foreground underline underline-offset-2 hover:text-foreground"
        />
      </p>
    </div>
  )
}

function RankBar({
  rank,
  n,
  decile,
  reverse,
}: {
  rank: number
  n: number
  decile: number
  reverse?: boolean
}) {
  const t = n <= 1 ? 0 : (rank - 1) / (n - 1)
  const left = reverse ? 1 - t : t
  return (
    <div className="min-w-[10rem] flex-1 space-y-0.5">
      <div className="flex items-center gap-2">
        <div className="relative h-1.5 min-w-0 flex-1 rounded-full bg-gradient-to-r from-slate-700 to-slate-200">
          <span
            className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background bg-foreground"
            style={{ left: `${left * 100}%` }}
          />
        </div>
        <span className="shrink-0 tabular-nums">
          rank {rank} of {n} · decile {decile}
        </span>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>1 = more deprived</span>
        <span>least deprived</span>
      </div>
    </div>
  )
}

function nationBadge(nation?: string) {
  if (!nation || !INDEX_BADGE[nation]) return "Deprivation"
  return `${NATION_NAME[nation]} · ${INDEX_BADGE[nation]}`
}

function nationPack(deprivation: DeprivationFile | null, nation?: string) {
  if (!deprivation || !nation) return null
  if (nation === "E") return deprivation.england
  if (nation === "W") return deprivation.wales
  if (nation === "S") return deprivation.scotland
  if (nation === "N") return deprivation.northernIreland
  return null
}

function emptyCopy(area?: AreaRecord | null): string {
  if (!area) return ""
  if (area.nation === "W") {
    return "Wales index not in this explorer (different index from England)."
  }
  if (area.nation === "S" || area.nation === "N") {
    return "SIMD / NIMDM not included — not a UK ranking."
  }
  if (area.grain === "region" || area.grain === "country" || area.grain === "counties") {
    return "IoD 2025 is a lower-tier index — not published for this geography."
  }
  return "No IoD figure for this area."
}
