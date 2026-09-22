import { iodDecile } from "@/lib/explorer/derive"
import type { AreaRecord, DeprivationFile } from "@/lib/explorer/types"
import { cn } from "@/lib/utils"

const INDEX_BADGE: Record<string, string> = {
  E: "IoD 2025",
  W: "WIMD 2025",
  S: "SIMD",
  N: "NIMDM",
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
  const badge = area?.nation ? INDEX_BADGE[area.nation] ?? "Deprivation" : "Deprivation"
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
        {area ? <span className="truncate font-medium">{area.name}</span> : null}
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
      <p className="mt-1 text-muted-foreground">
        Context only — not a cause of life expectancy.
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
      <div className="relative h-1.5 rounded-full bg-gradient-to-r from-slate-700 to-slate-200">
        <span
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background bg-foreground"
          style={{ left: `${left * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>most deprived</span>
        <span>
          rank {rank} of {n} · decile {decile}
        </span>
        <span>least deprived</span>
      </div>
    </div>
  )
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
  if (!area) return "Select a local area for a nation-locked rank."
  if (area.nation === "W") {
    return "WIMD not bundled in this build — ranks are not invented."
  }
  if (area.nation === "S" || area.nation === "N") {
    return "Not in this build."
  }
  if (area.grain === "region" || area.grain === "country" || area.grain === "counties") {
    return "IoD 2025 is a lower-tier index — not published for this geography."
  }
  return "No IoD figure for this area."
}
