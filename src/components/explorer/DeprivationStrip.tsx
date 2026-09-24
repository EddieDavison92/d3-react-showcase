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
  const nation = area ? (NATION_NAME[area.nation] ?? "this nation") : null

  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2.5 text-[13px] leading-snug",
        emphasised ? "border-slate-400 bg-white" : "border-slate-200 bg-slate-50/80"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {badge}
            <span className="normal-case tracking-normal"> · context, not an explanation</span>
          </p>
          <p className="mt-0.5 truncate font-medium text-foreground">
            {area?.name ?? "Select an area"}
          </p>
        </div>
        {rec && n && decile ? (
          <div className="flex shrink-0 gap-4 text-right">
            <Figure value={String(decile)} label="decile" hint="of 10" />
            <Figure value={String(rec.rankAverageScore)} label="rank" hint={`of ${n}`} />
          </div>
        ) : null}
      </div>

      {rec && n && decile && nation ? (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-slate-700">{decilePhrase(decile, nation)}</p>
          <RankBar rank={rec.rankAverageScore} n={n} reverse={reverseBar} />
        </div>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">{emptyCopy(area)}</p>
      )}

      <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
        <span>
          {nation
            ? `Ranked within ${nation} only — not a UK league, and not a cause of the life expectancy gap.`
            : "Deprivation is context only — not a cause of life expectancy."}
        </span>
        <AboutNumbers
          triggerVariant="ghost"
          label="About deprivation indices"
          triggerClassName="h-auto min-h-0 px-0 sm:h-auto sm:min-h-0 sm:px-0 text-xs font-normal text-muted-foreground underline underline-offset-2 hover:text-foreground"
        />
      </p>
    </div>
  )
}

function Figure({ value, label, hint }: { value: string; label: string; hint: string }) {
  return (
    <div>
      <p className="text-lg font-semibold tabular-nums leading-none text-foreground">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label} {hint}
      </p>
    </div>
  )
}

function RankBar({ rank, n, reverse }: { rank: number; n: number; reverse?: boolean }) {
  const t = n <= 1 ? 0 : (rank - 1) / (n - 1)
  const left = reverse ? 1 - t : t
  return (
    <div className="max-w-md space-y-0.5">
      <div className="relative h-1.5 rounded-full bg-gradient-to-r from-slate-700 to-slate-200">
        <span
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-slate-900"
          style={{ left: `${left * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>1 = more deprived</span>
        <span>least deprived</span>
      </div>
    </div>
  )
}

function decilePhrase(decile: number, nation: string): string {
  if (decile === 1) return `Most deprived tenth in ${nation}.`
  if (decile === 10) return `Least deprived tenth in ${nation}.`
  if (decile <= 3) return `Among the more deprived tenths in ${nation}.`
  if (decile >= 8) return `Among the less deprived tenths in ${nation}.`
  return `Middle of the ${nation} ranking.`
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
  if (!area) return "Pick an area to see its rank within its own nation."
  if (area.nation === "W") {
    return "WIMD is the Wales index and is not bundled here. It is a different index from England's IoD 2025 — not a UK ranking."
  }
  if (area.nation === "S" || area.nation === "N") {
    return "SIMD / NIMDM not included — not a UK ranking."
  }
  if (area.grain === "region" || area.grain === "country" || area.grain === "counties") {
    return "IoD 2025 is a lower-tier index — not published for this geography."
  }
  return "No IoD figure for this area."
}
