import { readFile } from "node:fs/promises"
import path from "node:path"
import Link from "next/link"
import { HeroMap } from "@/components/explorer/HeroMap"
import { byDeprivationTenth, type EvidenceFile } from "@/lib/explorer/evidence"
import { compactPeriod, formatSigned, formatYears } from "@/lib/explorer/format"
import { exploreHref } from "@/lib/explorer/url-state"
import type { PackedFile, SexId } from "@/lib/explorer/types"

const UK = "K02000001"

async function readJson<T>(name: string): Promise<T> {
  return JSON.parse(await readFile(path.join(process.cwd(), "public", "data", name), "utf-8")) as T
}

async function headlines() {
  const [le, evidence] = await Promise.all([
    readJson<PackedFile>("le.json"),
    readJson<EvidenceFile>("evidence.json"),
  ])
  const i = le.periods.length - 1
  const pre = le.periods.indexOf("2017 to 2019")
  const at = (code: string, sex: SexId, index = i) => le.values[code]?.[sex]?.birth?.[index]?.[0] ?? null
  const local = le.areas
    .filter((a) => a.grain === "ltla")
    .map((a) => ({ ...a, male: at(a.code, "Male") }))
    .filter((a): a is typeof a & { male: number } => a.male !== null)
    .sort((a, b) => b.male - a.male)
  const deciles = byDeprivationTenth(evidence, le, i)
  const decileGap =
    deciles[9]?.male != null && deciles[0]?.male != null ? deciles[9].male - deciles[0].male : null
  const ukMale = at(UK, "Male")
  const ukMalePre = at(UK, "Male", pre)
  return {
    period: compactPeriod(le.periods[i]),
    ukMale,
    ukFemale: at(UK, "Female"),
    changeMale: ukMale !== null && ukMalePre !== null ? ukMale - ukMalePre : null,
    highest: local[0],
    lowest: local[local.length - 1],
    decileGap,
  }
}

export default async function HomePage() {
  const h = await headlines()
  return (
    <div className="mx-auto w-full max-w-6xl pb-10">
      <section className="grid items-center gap-8 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:py-10">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-teal-800">ONS {h.period} · every UK local authority</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
            Where you live changes how long you live
          </h1>
          <p className="mt-5 text-pretty text-lg leading-relaxed text-slate-600">
            Men in {h.highest.name} can expect to live{" "}
            {formatYears(h.highest.male - h.lowest.male)} years longer than men in{" "}
            {h.lowest.name}. Map the gap across the UK, follow it over two decades, and see which
            local conditions track it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={exploreHref()}
              className="inline-flex h-11 items-center rounded-md bg-teal-800 px-5 text-sm font-medium text-white hover:bg-teal-900"
            >
              Open the map
            </Link>
            <Link
              href="/evidence"
              className="inline-flex h-11 items-center rounded-md border border-slate-300 bg-white px-5 text-sm font-medium text-slate-900 hover:border-slate-400"
            >
              See the evidence
            </Link>
          </div>
        </div>
        <HeroMap />
      </section>

      <section className="grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="UK life expectancy at birth"
          value={`${formatYears(h.ukMale)} / ${formatYears(h.ukFemale)}`}
          note={`Males / females, ${h.period}`}
          href={exploreHref({ geo: "country" })}
        />
        <Tile
          label="Change since 2017–19"
          value={`${formatSigned(h.changeMale)} years`}
          note={
            h.changeMale !== null && h.changeMale < 0
              ? "UK males, still below the pre-pandemic level"
              : "UK males, back to the pre-pandemic level"
          }
          href={exploreHref({ view: "d2017" })}
        />
        <Tile
          label="Highest to lowest"
          value={`${formatYears(h.highest.male - h.lowest.male)} years`}
          note={`${h.highest.name} ${formatYears(h.highest.male)} vs ${h.lowest.name} ${formatYears(h.lowest.male)}, males`}
          href={exploreHref({ area: h.lowest.code })}
        />
        <Tile
          label="Deprivation gap, England"
          value={`${formatYears(h.decileGap)} years`}
          note="Least vs most deprived tenth of areas, males"
          href="/evidence"
        />
      </section>
    </div>
  )
}

function Tile({ label, value, note, href }: { label: string; value: string; note: string; href: string }) {
  return (
    <Link href={href} className="group bg-white p-5 hover:bg-slate-50">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{note}</p>
    </Link>
  )
}
