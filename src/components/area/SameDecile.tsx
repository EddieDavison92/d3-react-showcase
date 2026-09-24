import Link from "next/link"
import { formatYears } from "@/lib/explorer/format"
import { cn } from "@/lib/utils"

type Row = { code: string; name: string; male: number | null; female: number | null }

/** Areas in the same deprivation tenth: men and women as a dot pair on one axis. */
export function SameDecile({ rows, code, domain }: { rows: Row[]; code: string; domain: [number, number] }) {
  const sorted = [...rows].sort((a, b) => (b.male ?? 0) - (a.male ?? 0))
  const at = (v: number | null) => (v === null ? null : ((v - domain[0]) / (domain[1] - domain[0])) * 100)
  const ticks: number[] = []
  for (let t = Math.ceil(domain[0] / 2) * 2; t <= domain[1]; t += 2) ticks.push(t)

  return (
    <div>
      <div className="grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)] gap-x-4">
        <span />
        <div className="relative h-5">
          {ticks.map((t) => (
            <span key={t} className="absolute -translate-x-1/2 text-2xs tabular text-ink-3" style={{ left: `${at(t)}%` }}>
              {t}
            </span>
          ))}
        </div>
      </div>
      <ol>
        {sorted.map((row) => {
          const self = row.code === code
          const m = at(row.male)
          const f = at(row.female)
          return (
            <li key={row.code}>
              <Link
                href={`/area/${row.code}`}
                className={cn(
                  "group grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)] items-center gap-x-4 rounded-md py-[3px] text-sm",
                  self ? "bg-white shadow-[0_0_0_1px_rgba(17,19,21,0.08)]" : "hover:bg-white/60"
                )}
              >
                <span className={cn("truncate pl-2", self ? "font-semibold text-ink" : "text-ink-2 group-hover:text-ink")}>
                  {row.name}
                </span>
                <span className="relative h-4">
                  {ticks.map((t) => (
                    <span key={t} className="absolute inset-y-0 w-px bg-line/60" style={{ left: `${at(t)}%` }} />
                  ))}
                  {m !== null && f !== null ? (
                    <span
                      className="absolute top-1/2 h-px -translate-y-1/2 bg-ink/20"
                      style={{ left: `${Math.min(m, f)}%`, width: `${Math.abs(f - m)}%` }}
                    />
                  ) : null}
                  {m !== null ? (
                    <span
                      title={`Men ${formatYears(row.male)}`}
                      className={cn("absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-male", self ? "h-3 w-3" : "h-2 w-2")}
                      style={{ left: `${m}%` }}
                    />
                  ) : null}
                  {f !== null ? (
                    <span
                      title={`Women ${formatYears(row.female)}`}
                      className={cn("absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-female", self ? "h-3 w-3" : "h-2 w-2")}
                      style={{ left: `${f}%` }}
                    />
                  ) : null}
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
