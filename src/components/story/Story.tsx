"use client"

import Link from "next/link"
import { useMemo } from "react"
import { DecileLines } from "@/components/story/DecileLines"
import { DotStage, type DotScene } from "@/components/story/DotStage"
import { FactorGrid } from "@/components/story/FactorGrid"
import { Lifelines } from "@/components/story/Lifelines"
import { PlaceSearch } from "@/components/story/PlaceSearch"
import { Scrolly } from "@/components/story/Scrolly"
import { StallChart } from "@/components/story/StallChart"
import { formatSigned, formatYears } from "@/lib/explorer/format"
import { cn } from "@/lib/utils"
import type { StoryData } from "@/lib/story/data"

const months = (years: number) => Math.round(years * 12 * 10) / 10
const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"]
const words = (n: number) => WORDS[n] ?? String(n)
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const moved = (d: number) =>
  Math.abs(d) < 0.05 ? "barely changed" : `${d > 0 ? "gained" : "lost"} ${formatYears(Math.abs(d))} years`

export function Story({ data }: { data: StoryData }) {
  const { index, extremes, stall, facts, deciles, lower } = data
  const gapMale = extremes.male.top.value - extremes.male.bottom.value
  const gapFemale = extremes.female.top.value - extremes.female.bottom.value
  const places = useMemo(
    () => data.areas.map((a) => ({ code: a.code, name: a.name, geo: "ltla" as const })),
    [data.areas]
  )
  const d1 = deciles.male[0]
  const d10 = deciles.male[9]
  const change = (row: (number | null)[]) => (row[index.now] ?? 0) - (row[index.stall] ?? 0)

  const ends = [extremes.male.top.code, extremes.male.bottom.code]
  const reference = { male: stall.male.now, female: stall.female.now }
  const gapScenes: DotScene[] = [
    { layout: "map", colour: "gap", sex: "male", highlight: ends },
    { layout: "map", colour: "gap", sex: "male", highlight: ends, rings: [...extremes.male.topTen, ...extremes.male.bottomTen] },
    { layout: "rank", colour: "gap", sex: "male", highlight: ends },
  ]
  const splitScenes: DotScene[] = [
    { layout: "decile", colour: "decile", sex: "male", means: true },
    { layout: "change", colour: "change", sex: "male", means: true },
  ]

  return (
    <article className="pb-24">
      {/* 01 · Ten years apart */}
      <Scrolly
        id="gap"
        stage={(step) => (
          <DotStage areas={data.areas} scene={gapScenes[step]} now={index.now} base={index.stall} reference={reference} intro />
        )}
        steps={[
          <div key="intro" className="max-w-xl">
            <p className="kicker animate-rise">Life expectancy across the UK · 2001–2024</p>
            <h1 className="display mt-3 animate-rise text-[clamp(3rem,10vw,8.5rem)] leading-[0.86] text-ink [animation-delay:120ms] sm:mt-6">
              <span className="block">Ten years</span>
              <span className="mt-[0.08em] flex items-center gap-[0.18em]">
                <Ruler />
                <span>apart</span>
              </span>
            </h1>
            <p className="mt-4 max-w-md animate-rise text-[15.5px] leading-relaxed text-ink-2 [animation-delay:260ms] sm:mt-8 sm:text-lg">
              A boy born in <strong className="font-semibold text-ink">{extremes.male.top.name}</strong> can expect to
              live {formatYears(gapMale)} years longer than one born in{" "}
              <strong className="font-semibold text-ink">{extremes.male.bottom.name}</strong>, if today&apos;s death
              rates hold. This is where that gap lies, how progress stalled, and what travels with it.
            </p>
            <p className="mt-10 hidden items-center gap-3 text-[11px] uppercase tracking-wider text-ink-3 lg:flex">
              <span className="relative h-9 w-[2px] overflow-hidden rounded-full bg-line">
                <span className="absolute inset-x-0 top-0 h-3 animate-[scrollcue_1.8s_ease-in-out_infinite] rounded-full bg-ink" />
              </span>
              Scroll
            </p>
          </div>,
          <Step key="map" n="01" title="Every dot is a place">
            <p>
              Each of the {data.areas.length} dots is a UK local authority, set roughly where it sits on the map. Colour
              shows how far male life expectancy in 2022–24 sits from the UK figure of {formatYears(reference.male)}{" "}
              years: <span className="font-semibold text-[#b3452c]">brick</span> for shorter,{" "}
              <span className="font-semibold text-[#2a8a76]">teal</span> for longer.
            </p>
            <p>
              The ringed dots are the ten highest and ten lowest.{" "}
              {facts.topTenEngland === 10 ? "All ten" : capital(words(facts.topTenEngland))} of the highest are in
              England. {capital(words(facts.bottomTenScotland))} of the ten lowest are in Scotland.
            </p>
            <p className="text-sm text-ink-3">Hover or tap any dot for its figures.</p>
          </Step>,
          <Step key="rank" n="02" title="Lined up">
            <p>
              Sort every place by life expectancy and most crowd the middle: half sit within{" "}
              {formatYears(facts.iqrMale)} years of each other. The tails reach much further, from{" "}
              {formatYears(extremes.male.bottom.value)} to {formatYears(extremes.male.top.value)}.
            </p>
            <p>
              For women the range is {formatYears(gapFemale)} years, from {extremes.female.bottom.name} (
              {formatYears(extremes.female.bottom.value)}) to {extremes.female.top.name} (
              {formatYears(extremes.female.top.value)}).
            </p>
            <BigStat value={formatYears(gapMale)} label="years between the top and bottom, men" />
          </Step>,
        ]}
      />

      {/* 02 · The stall */}
      <ChapterHead n="02" title="The stall" dek="For a decade life expectancy rose steadily. Then, well before COVID-19, it almost stopped." />
      <Scrolly
        id="stall"
        side="right"
        stage={(step) => <StallChart data={data} step={step} />}
        steps={[
          <Step key="rise" n="01" title="A decade of gains">
            <p>
              From 2001–03 to 2011–13, UK life expectancy rose by about {months(stall.male.pre)} months a year for men
              and {months(stall.female.pre)} months for women.
            </p>
          </Step>,
          <Step key="flat" n="02" title="Then it flattened">
            <p>
              Between 2011–13 and 2017–19 the gains shrank to {months(stall.male.post)} months a year for men and{" "}
              {months(stall.female.post)} for women. The slowdown began years before the pandemic.
            </p>
          </Step>,
          <Step key="covid" n="03" title="COVID and after">
            <p>
              COVID-19 pushed life expectancy down. By 2022–24 men were at {formatYears(stall.male.now)} years,{" "}
              {stall.male.now < stall.male.precovid ? "still below" : "back to"} their 2017–19 level of{" "}
              {formatYears(stall.male.precovid)}. Women were at {formatYears(stall.female.now)}.
            </p>
            <p>
              Had the 2001–13 pace simply continued, men would be at about {formatYears(stall.male.trendNow)}. The dashed
              line extends that earlier trend; it is not a forecast.
            </p>
            <BigStat value={formatYears(stall.male.shortfall)} label="years below the earlier trend, men" />
          </Step>,
        ]}
      />

      {/* 03 · The split */}
      <ChapterHead
        n="03"
        title="The split"
        dek="The stall wasn't shared equally. In England, the most deprived places slipped back while the least deprived kept gaining."
      />
      <Scrolly
        id="split"
        stage={(step) => (
          <div className="relative h-full">
            <div className={cn("absolute inset-0 transition-opacity duration-700", step < 2 ? "opacity-100" : "pointer-events-none opacity-0")}>
              <DotStage areas={data.areas} scene={splitScenes[Math.min(step, 1)]} now={index.now} base={index.stall} reference={reference} />
            </div>
            <div className={cn("absolute inset-0 transition-opacity duration-700", step >= 2 ? "opacity-100" : "pointer-events-none opacity-0")}>
              <DecileLines data={data} sex="male" active={step >= 2} />
            </div>
          </div>
        )}
        steps={[
          <Step key="tenths" n="01" title="Ten steps down">
            <p>
              Here England&apos;s {facts.englandAreas} local authorities are split into ten equal groups by deprivation
              (IMD 2025). Black ticks mark each group&apos;s average.
            </p>
            <p>
              Life expectancy falls with each step: men in the most deprived tenth average {formatYears(d1[index.now])}{" "}
              years, in the least deprived {formatYears(d10[index.now])}. Wales, Scotland and Northern Ireland use
              different indices, so they sit apart.
            </p>
          </Step>,
          <Step key="moved" n="02" title="Moving apart">
            <p>
              Now each dot shows the change since 2011–13. On average the least deprived tenth{" "}
              {moved(change(d10))}. The most deprived {moved(change(d1))}.
            </p>
            <p>
              Across the UK, {lower.male} of {lower.of} places now have lower male life expectancy than in 2011–13.
            </p>
            <p className="text-sm text-ink-3">
              Single areas are noisy: a typical 95% interval spans about {formatYears(facts.medianCiMale)} years, so
              read the groups, not individual dots.
            </p>
          </Step>,
          <Step key="gap" n="03" title="A wider gap">
            <p>
              The gap between the most and least deprived tenths grew from {formatYears(deciles.gapMale[index.stall])}{" "}
              to {formatYears(deciles.gapMale[index.now])} years for men, and from{" "}
              {formatYears(deciles.gapFemale[index.stall])} to {formatYears(deciles.gapFemale[index.now])} for women.
            </p>
            <p className="text-sm text-ink-3">
              Areas are grouped by today&apos;s deprivation ranking throughout. Averages are of areas, not weighted by
              population.
            </p>
          </Step>,
        ]}
      />

      {/* 04 · The years in between */}
      <ChapterHead
        n="04"
        title="The years in between"
        dek="Healthy life expectancy counts the years people rate their health as good or very good. Here the gap is wider still."
      />
      <Section>
        <Lifelines data={data} />
        <Notes>
          Healthy life expectancy is published for upper-tier authorities in England; districts share their
          county&apos;s figure. ONS labels it official statistics in development, and its survey changed during the
          pandemic. UK healthy life expectancy for men was {formatYears(data.ukHle.male[0])} in{" "}
          {data.ukHle.periods[0].replace(/^(\d{4}) to \d{2}(\d{2})$/, "$1–$2")} and {formatYears(data.ukHle.male.at(-1))} in{" "}
          {data.ukHle.periods.at(-1)?.replace(/^(\d{4}) to \d{2}(\d{2})$/, "$1–$2")}; treat that fall with some caution.
        </Notes>
      </Section>

      {/* 05 · What travels with it */}
      <ChapterHead
        n="05"
        title="What travels with it"
        dek="Across English local authorities, life expectancy lines up closely with local circumstances. Each panel plots one against male or female life expectancy."
      />
      <Section>
        <FactorGrid data={data} />
        <Notes>
          These are correlations between areas (Pearson r, −1 to +1). They don&apos;t show cause, they overlap with each
          other, and they say nothing about any individual. Air pollution barely correlates because the most polluted
          places are also among the longest-lived: all {facts.airTop30London} of the 30 highest are London boroughs.
          Factors come from OHID Fingertips (fetched {data.fetched}); see the periods on each panel.
        </Notes>
      </Section>

      {/* 06 · Your place */}
      <ChapterHead
        n="06"
        title="Your place"
        dek="See how your local authority compares: life expectancy, healthy years, the trend since 2001 and local circumstances."
      />
      <Section>
        <PlaceSearch areas={places} className="max-w-xl" />
        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          <span className="mono self-center text-[11px] uppercase tracking-wider text-ink-3">Try</span>
          {[extremes.male.top, extremes.male.bottom, extremes.female.top].map((a) => (
            <Link
              key={a.code}
              href={`/area/${a.code}`}
              className="rounded-full border border-line bg-white/60 px-3.5 py-1.5 text-ink-2 transition hover:border-ink/25 hover:text-ink"
            >
              {a.name}
            </Link>
          ))}
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          <Card href="/explore" title="The atlas" body="Every measure on one map, from 2001–03 to 2022–24." />
          <Card href="/evidence" title="The evidence" body="All fifteen local indicators, plotted and ranked." />
        </div>
      </Section>
    </article>
  )
}

function Step({ n, title, children }: { n?: string; title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-md">
      {n ? <p className="kicker mb-3">{n}</p> : null}
      <h3 className="display text-[1.75rem] leading-tight text-ink sm:text-4xl">{title}</h3>
      <div className="prose-story mt-3 text-[15.5px] leading-relaxed text-ink-2 sm:mt-4 sm:text-[17px] [&_strong]:font-semibold [&_strong]:text-ink">
        {children}
      </div>
    </div>
  )
}

function BigStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="!mt-7 border-t-2 border-ink pt-3">
      <p className="display text-7xl text-ink">{value}</p>
      <p className="mono mt-1 text-[11px] text-ink-3">{label}</p>
    </div>
  )
}

/** Chapter opener: a heavy rule, a large numeral and the title. */
function ChapterHead({ n, title, dek }: { n: string; title: string; dek: string }) {
  return (
    <header className="mt-36 border-t-[3px] border-ink pt-5 sm:mt-48">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)] lg:gap-12">
        <p className="display text-[clamp(4rem,9vw,7.5rem)] leading-[0.8] text-ink/15">{n}</p>
        <div>
          <h2 className="display text-[clamp(2.75rem,7vw,6rem)] leading-[0.88] text-ink">{title}</h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-2">{dek}</p>
        </div>
      </div>
    </header>
  )
}

function Section({ children }: { children: React.ReactNode }) {
  return <section className="mt-16 lg:ml-[calc(5/13*100%+1.25rem)]">{children}</section>
}

function Notes({ children }: { children: React.ReactNode }) {
  return <p className="mt-10 max-w-3xl border-l-2 border-ink pl-4 text-sm leading-relaxed text-ink-2">{children}</p>
}

/** Ten-year ruler between the two dots of the mark: brick (shorter) to teal (longer). */
function Ruler() {
  return (
    <span aria-hidden className="relative flex h-[0.5em] w-[2.1em] shrink-0 items-center">
      <span className="absolute inset-x-[0.11em] top-1/2 h-[2px] -translate-y-1/2 bg-ink" />
      <span className="absolute inset-x-[0.11em] top-1/2 flex -translate-y-1/2 items-center justify-between">
        {Array.from({ length: 11 }, (_, i) => (
          <span key={i} className={cn("w-[2px] bg-ink", i % 5 === 0 ? "h-[0.2em]" : "h-[0.1em]")} />
        ))}
      </span>
      <span className="absolute left-0 top-1/2 h-[0.22em] w-[0.22em] -translate-y-1/2 rounded-full bg-[#b3452c]" />
      <span className="absolute right-0 top-1/2 h-[0.22em] w-[0.22em] -translate-y-1/2 rounded-full bg-[#0b5a4c]" />
    </span>
  )
}

function Card({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between gap-6 rounded-2xl border border-line bg-white/60 p-6 transition hover:-translate-y-0.5 hover:border-ink/20 hover:bg-white hover:shadow-[0_20px_40px_-28px_rgba(17,19,21,0.4)]"
    >
      <p className="display text-4xl text-ink">
        {title} <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
      </p>
      <p className="text-ink-2">{body}</p>
    </Link>
  )
}
