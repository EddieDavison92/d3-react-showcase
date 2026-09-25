"use client"

import { useInView } from "@/components/story/use-in-view"
import { useTween } from "@/components/story/use-tween"
import { formatYears } from "@/lib/explorer/format"
import type { StoryData } from "@/lib/story/data"
import { POOR_FILL } from "@/lib/story/palette"

const SPAN = 90
const HATCH = POOR_FILL

/** Healthy and not-healthy years at birth, one bar per deprivation tenth. */
export function Lifelines({ data, sex }: { data: StoryData; sex: "male" | "female" }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.3)
  const rows = data.lifelines
  const target = rows.flatMap((row) => [row[sex].healthy ?? 0, row[sex].life ?? 0])
  const t = useTween(seen ? target : target.map(() => 0), seen ? 900 : 0)
  const at = (i: number) => ({ healthy: t[i * 2] ?? 0, life: t[i * 2 + 1] ?? 0 })
  const first = at(0)
  const last = at(9)

  return (
    <div ref={ref}>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Legend swatch={{ background: "#1a7a6b" }} label="Years in good health" />
        <Legend swatch={{ background: HATCH }} label="Years not in good health" />
      </div>

      <div className="mt-8">
        <div className="relative ml-[4.5rem] mr-10 h-5 sm:ml-[8.5rem]">
          {[0, 20, 40, 60, 80].map((tick) => (
            <span key={tick} className="mono absolute -translate-x-1/2 text-[10px] text-ink-3" style={{ left: `${(tick / SPAN) * 100}%` }}>
              {tick}
            </span>
          ))}
        </div>
        <ol className="space-y-[5px]">
          {rows.map((row, i) => {
            const { healthy, life } = at(i)
            const poor = Math.max(0, life - healthy)
            return (
              <li key={row.decile} className="flex items-center gap-3">
                <span className="w-[3.75rem] shrink-0 text-right text-xs leading-tight text-ink-2 sm:w-[7.75rem]">
                  <span className="mono text-ink">{row.decile}</span>
                  <span className="hidden sm:inline">{row.decile === 1 ? " most deprived" : row.decile === 10 ? " least deprived" : ""}</span>
                </span>
                <div className="relative mr-10 h-7 flex-1">
                  {[20, 40, 60, 80].map((tick) => (
                    <span key={tick} className="absolute inset-y-0 w-px bg-line/70" style={{ left: `${(tick / SPAN) * 100}%` }} />
                  ))}
                  <div className="absolute inset-y-0 left-0 flex" style={{ width: `${(life / SPAN) * 100}%` }}>
                    <span
                      className="mono flex h-full items-center justify-end overflow-hidden rounded-l-[3px] bg-[#1a7a6b] pr-2 text-[10.5px] text-white"
                      style={{ width: `${life ? (healthy / life) * 100 : 0}%` }}
                    >
                      {healthy > 8 ? formatYears(healthy) : ""}
                    </span>
                    <span
                      className="mono ml-[2px] flex h-full flex-1 items-center justify-end overflow-hidden rounded-r-[3px] pr-2 text-[10.5px] text-ink-2"
                      style={{ background: HATCH }}
                      aria-label={`${formatYears(poor)} years not in good health`}
                    >
                      {poor > 8 ? formatYears(poor) : ""}
                    </span>
                  </div>
                  <span
                    className="mono absolute top-1/2 -translate-y-1/2 pl-2 text-xs font-semibold text-ink"
                    style={{ left: `${(life / SPAN) * 100}%`, opacity: seen ? 1 : 0 }}
                  >
                    {formatYears(life)}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
        <p className="mono ml-[4.5rem] mt-2 text-[10px] text-ink-3 sm:ml-[8.5rem]">
          Years from birth, {data.hlePeriod.replace(/^(\d{4}) to \d{2}(\d{2})$/, "$1–$2")} · mean of upper-tier areas in each deprivation tenth
        </p>
      </div>

      <dl className="mt-10 grid grid-cols-1 gap-6 border-t border-line pt-6 sm:grid-cols-3">
        <Figure value={formatYears(last.healthy - first.healthy)} label="Gap in healthy years" note="least vs most deprived tenth" />
        <Figure value={formatYears(last.life - first.life)} label="Gap in total lifespan" note="same areas, same period" />
        <Figure
          value={`${formatYears(first.life - first.healthy)} / ${formatYears(last.life - last.healthy)}`}
          label="Years not in good health"
          note="most / least deprived tenth"
        />
      </dl>
    </div>
  )
}

function Legend({ swatch, label }: { swatch: React.CSSProperties; label: string }) {
  return (
    <span className="flex items-center gap-2 text-sm text-ink-2">
      <span className="h-3 w-5 rounded-[3px]" style={swatch} />
      {label}
    </span>
  )
}

function Figure({ value, label, note }: { value: string; label: string; note: string }) {
  return (
    <div>
      <dt className="text-sm text-ink-2">{label}</dt>
      <dd className="display mt-1 text-5xl text-ink">
        {value}
        <span className="ml-1.5 font-sans text-sm font-normal tracking-normal text-ink-3">years</span>
      </dd>
      <p className="mt-1 text-xs text-ink-3">{note}</p>
    </div>
  )
}
