import { iodDecile } from "@/lib/explorer/derive"
import type { AreaRecord, DeprivationFile } from "@/lib/explorer/types"
import { cn } from "@/lib/utils"

const NATION_LABEL: Record<string, string> = {
  E: "England",
  W: "Wales",
  S: "Scotland",
  N: "Northern Ireland",
  UK: "United Kingdom",
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
  const nation = area?.nation ? NATION_LABEL[area.nation] ?? area.nation : null
  const iod = deprivation?.england
  const rec = area && iod ? iod.values[area.code] : undefined
  const n = iod ? Object.keys(iod.values).length : 0
  const decile = rec ? iodDecile(rec.rankAverageScore, n) : null

  return (
    <div
      className={cn(
        "rounded-md border px-2.5 py-2 text-[11px] leading-snug",
        emphasised ? "border-teal-700/50 bg-teal-50/60 dark:bg-teal-950/20" : "bg-muted/30"
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border bg-background px-2 py-0.5 font-medium">
          {nation ?? "Deprivation context"}
        </span>
        {rec && n ? (
          <span className="text-muted-foreground">
            IoD 2025 · rank {rec.rankAverageScore} of {n} · decile {decile}
          </span>
        ) : null}
      </div>
      {rec && n && decile ? (
        <RankBar rank={rec.rankAverageScore} n={n} decile={decile} />
      ) : (
        <p className="mt-1 text-muted-foreground">{emptyCopy(area)}</p>
      )}
      <p className="mt-1 text-muted-foreground">
        Shown for context — not as an explanation of life expectancy. Ranks are
        not comparable across nations; there is no UK deprivation league.
      </p>
    </div>
  )
}

function RankBar({ rank, n, decile }: { rank: number; n: number; decile: number }) {
  const t = n <= 1 ? 0 : (rank - 1) / (n - 1)
  return (
    <div className="mt-1.5 space-y-0.5">
      <div className="relative h-1.5 rounded-full bg-gradient-to-r from-slate-700 to-slate-200">
        <span
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background bg-foreground"
          style={{ left: `${t * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>most deprived</span>
        <span>decile {decile}</span>
        <span>least</span>
      </div>
    </div>
  )
}

function emptyCopy(area?: AreaRecord | null): string {
  if (!area) return "Select a local area for a nation-locked rank. England IoD when England."
  if (area.nation === "W") {
    return "WIMD 2025 is the Wales index. A local-authority file is not bundled here — we are not inventing ranks."
  }
  if (area.nation === "S" || area.nation === "N") {
    return "SIMD and NIMDM are not interactive in v1. Nation indices must not be mixed into one ranking."
  }
  if (area.grain === "region" || area.grain === "country" || area.grain === "counties") {
    return "English IoD 2025 is a lower-tier local-authority index — not published for this geography."
  }
  return "No IoD figure for this area."
}
