import { readFile } from "node:fs/promises"
import path from "node:path"
import type { Metadata } from "next"
import { ONS_LINKS } from "@/lib/explorer/catalogue"
import type { EvidenceFile } from "@/lib/explorer/evidence"

export const metadata: Metadata = { title: "Methods" }

async function loadEvidence(): Promise<EvidenceFile> {
  const file = path.join(process.cwd(), "public", "data", "evidence.json")
  return JSON.parse(await readFile(file, "utf-8")) as EvidenceFile
}

export default async function AboutPage() {
  const evidence = await loadEvidence()
  return (
    <article className="mx-auto w-full max-w-6xl pb-16 pt-10 sm:pt-14">
      <header className="max-w-3xl animate-rise">
        <p className="kicker">Methods</p>
        <h1 className="display mt-3 text-5xl text-ink sm:text-7xl">Sources and methods</h1>
        <p className="mt-6 text-xl leading-relaxed text-ink-2">
          Every figure comes from official statistics, reused under the{" "}
          <a className="link" href={ONS_LINKS.ogl}>
            Open Government Licence v3.0
          </a>
          . Numbers in the story are computed from these files when the site is built; none are typed in by hand.
        </p>
      </header>

      <Section title="Life expectancy">
        <p>
          ONS period life expectancy for UK local areas, three-year windows from 2001–03 to 2022–24, at birth and at age
          65, for males and females. A period figure summarises death rates in those years. It isn&apos;t a forecast of
          how long anyone born then will live.
        </p>
        <p>
          ONS doesn&apos;t test local differences for significance. Where this site calls a change or gap not
          significant, the 95% confidence intervals overlap. City of London and the Isles of Scilly are left out of the
          ONS local series because their populations are small. English counties are a separate geography, so they are
          never ranked against districts.
        </p>
        <Links
          items={[
            ["Bulletin", ONS_LINKS.leBulletin],
            ["Dataset", ONS_LINKS.leDataset],
            ["National life tables", ONS_LINKS.nationalLifeTables],
          ]}
        />
      </Section>

      <Section title="The story's calculations">
        <p>
          <strong>Gap to the UK.</strong> Each place&apos;s life expectancy minus the UK figure for the same sex and
          period. Colours saturate at 4.5 years either side.
        </p>
        <p>
          <strong>The stall.</strong> Average yearly gain between period windows: (2011–13 minus 2001–03) ÷ 10, and
          (2017–19 minus 2011–13) ÷ 6. The dashed line extends the 2001–13 pace from 2011–13; it shows where the earlier
          trend would have led, not a forecast.
        </p>
        <p>
          <strong>Deprivation tenths.</strong> English local authorities ranked by IMD 2025 average score and cut into ten
          groups of equal count. The same 2025 grouping is used for every year, so &ldquo;most deprived&rdquo; means most
          deprived today. Group figures are simple means of areas, not weighted by population.
        </p>
        <p>
          <strong>Healthy years.</strong> The same method on upper-tier authorities, because healthy life expectancy
          isn&apos;t published for English districts.
        </p>
      </Section>

      <Section title="Healthy life expectancy">
        <p>
          Years lived in self-reported good or very good health, from the Annual Population Survey. ONS labels it
          official statistics in development, and its survey changed during the pandemic, so treat recent movements with
          care. In England it is published for upper-tier authorities only, so a district shows its county&apos;s figure.
        </p>
        <Links
          items={[
            ["Bulletin", ONS_LINKS.hleBulletin],
            ["Dataset", ONS_LINKS.hleDataset],
            ["Health Foundation analysis", ONS_LINKS.hleWatershed],
          ]}
        />
      </Section>

      <Section title="Avoidable deaths">
        <p>
          Age-standardised death rates from causes that are preventable through public health or treatable through
          timely healthcare, for people under 75. ONS publishes these for England and Wales only.
        </p>
        <Links
          items={[
            ["Bulletin", ONS_LINKS.avoidableBulletin],
            ["Dataset", ONS_LINKS.avoidableDataset],
          ]}
        />
      </Section>

      <Section title="Deprivation">
        <p>
          English Indices of Deprivation 2025, local authority summaries. Wales, Scotland and Northern Ireland each have
          their own index. Their ranks can&apos;t be compared with England&apos;s, so they aren&apos;t included.
        </p>
        <Links items={[["IoD 2025", ONS_LINKS.iod]]} />
      </Section>

      <Section title="Local indicators">
        <p>
          {evidence.indicators.length} indicators from{" "}
          <a className="link" href={evidence.meta.url}>
            OHID Fingertips
          </a>
          , England only, fetched {evidence.meta.fetched}. Each uses the latest period with values for at least 90% of
          local authorities (80% for drug deaths, where small counts are suppressed). Correlations are Pearson r across
          local authorities, each area counted once regardless of population.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-y-2 border-ink text-left">
                <th className="py-2.5 pr-3 font-semibold text-ink">Indicator</th>
                <th className="hidden px-3 py-2.5 font-semibold text-ink sm:table-cell">Group</th>
                <th className="px-3 py-2.5 font-semibold text-ink">Period</th>
                <th className="py-2.5 pl-3 font-semibold text-ink">Unit</th>
              </tr>
            </thead>
            <tbody>
              {evidence.indicators.map((indicator) => (
                <tr key={indicator.key} className="border-b border-line">
                  <td className="py-2.5 pr-3">
                    <a className="link" href={indicator.url}>
                      {indicator.label}
                    </a>
                  </td>
                  <td className="hidden px-3 py-2.5 text-ink-2 sm:table-cell">{indicator.group}</td>
                  <td className="mono whitespace-nowrap px-3 py-2.5 text-[13px] text-ink-2">{indicator.period}</td>
                  <td className="py-2.5 pl-3 text-ink-2">{indicator.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Correlation between areas isn&apos;t causation, and it says nothing about individuals. Deprivation, smoking,
          obesity and early deaths move together, so their links with life expectancy overlap rather than add up.
          OHID&apos;s{" "}
          <a className="link" href={ONS_LINKS.segment}>
            Segment tool
          </a>{" "}
          splits the deprivation gap in life expectancy by cause of death.
        </p>
      </Section>

      <Section title="Maps and code">
        <p>
          Boundaries from the ONS Open Geography Portal (contains OS data © Crown copyright and database right). The hex
          layout in the story is{" "}
          <a className="link" href="https://github.com/odileeds/hexmaps">
            Open Innovations&apos; UK local authority hex map
          </a>{" "}
          (MIT licence). Postcode search uses postcodes.io. Processing scripts are in the{" "}
          <a className="link" href="https://github.com/EddieDavison92/life-expectancy-uk">
            GitHub repository
          </a>
          .
        </p>
      </Section>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-16 grid grid-cols-1 gap-6 border-t border-line pt-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12">
      <h2 className="display text-3xl text-ink">{title}</h2>
      <div className="max-w-3xl space-y-4 text-[17px] leading-relaxed text-ink-2 [&_strong]:font-semibold [&_strong]:text-ink">
        {children}
      </div>
    </section>
  )
}

function Links({ items }: { items: [string, string][] }) {
  return (
    <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
      {items.map(([label, href]) => (
        <a key={href} className="link" href={href}>
          {label} ↗
        </a>
      ))}
    </p>
  )
}
