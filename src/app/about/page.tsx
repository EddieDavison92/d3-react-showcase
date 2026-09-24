import { readFile } from "node:fs/promises"
import path from "node:path"
import type { Metadata } from "next"
import { ONS_LINKS } from "@/lib/explorer/catalogue"
import type { EvidenceFile } from "@/lib/explorer/evidence"

export const metadata: Metadata = { title: "About" }

async function loadEvidence(): Promise<EvidenceFile> {
  const file = path.join(process.cwd(), "public", "data", "evidence.json")
  return JSON.parse(await readFile(file, "utf-8")) as EvidenceFile
}

export default async function AboutPage() {
  const evidence = await loadEvidence()
  return (
    <article className="mx-auto w-full max-w-3xl space-y-10 py-4 pb-12 text-slate-700">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Sources and methods
        </h1>
        <p className="mt-2">
          Every figure here comes from official statistics, reused under the{" "}
          <A href={ONS_LINKS.ogl}>Open Government Licence v3.0</A>. This is an independent
          project, not an ONS product.
        </p>
      </header>

      <Section title="Life expectancy">
        <p>
          ONS period life expectancy for UK local areas, three-year windows from 2001–03 to
          2022–24, at birth and at age 65, males and females. A period figure summarises death
          rates in those years. It is not a forecast of how long anyone born then will live.
        </p>
        <p>
          ONS doesn&apos;t test local differences for significance. Where this site calls a change
          or gap not significant, the 95% confidence intervals overlap. City of London and the
          Isles of Scilly are left out of the ONS local series because their populations are
          small. English counties are a separate geography, so they are never ranked against
          districts.
        </p>
        <Links
          items={[
            ["Bulletin", ONS_LINKS.leBulletin],
            ["Dataset", ONS_LINKS.leDataset],
            ["National life tables", ONS_LINKS.nationalLifeTables],
          ]}
        />
      </Section>

      <Section title="Healthy life expectancy">
        <p>
          Years lived in self-reported good or very good health, from the Annual Population
          Survey. ONS labels it official statistics in development. In England it is published
          for upper-tier authorities only, so a district shows its county&apos;s figure.
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
          Age-standardised death rates from causes that are preventable through public health
          or treatable through timely healthcare, for people under 75. ONS publishes these for
          England and Wales only.
        </p>
        <Links items={[["Bulletin", ONS_LINKS.avoidableBulletin], ["Dataset", ONS_LINKS.avoidableDataset]]} />
      </Section>

      <Section title="Deprivation">
        <p>
          English Indices of Deprivation 2025, local authority summaries (rank of average score).
          Wales, Scotland and Northern Ireland each have their own index. Their ranks can&apos;t
          be compared with England&apos;s, so they aren&apos;t included.
        </p>
        <Links items={[["IoD 2025", ONS_LINKS.iod]]} />
      </Section>

      <Section title="Evidence indicators">
        <p>
          The Evidence page and the risk-factor profile use {evidence.indicators.length}{" "}
          indicators from <A href={evidence.meta.url}>OHID Fingertips</A>, England only, fetched{" "}
          {evidence.meta.fetched}. Each uses the latest period with values for at least 90% of
          local authorities (80% for drug deaths, where small counts are suppressed). Correlations
          are Pearson r across local authorities, with each area counted once regardless of
          population.
        </p>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
                <th className="px-3 py-2 font-medium">Indicator</th>
                <th className="px-3 py-2 font-medium">Group</th>
                <th className="px-3 py-2 font-medium">Period</th>
                <th className="px-3 py-2 font-medium">Unit</th>
              </tr>
            </thead>
            <tbody>
              {evidence.indicators.map((indicator) => (
                <tr key={indicator.key} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2">
                    <A href={indicator.url}>{indicator.label}</A>
                  </td>
                  <td className="px-3 py-2 text-slate-500">{indicator.group}</td>
                  <td className="px-3 py-2 tabular-nums text-slate-500">{indicator.period}</td>
                  <td className="px-3 py-2 text-slate-500">{indicator.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Correlation between areas isn&apos;t causation, and it says nothing about individuals.
          Deprivation, smoking, obesity and early deaths move together, so their links with life
          expectancy overlap rather than add up. OHID&apos;s{" "}
          <A href={ONS_LINKS.segment}>Segment tool</A> splits the deprivation gap in life
          expectancy by cause of death.
        </p>
      </Section>

      <Section title="Boundaries and code">
        <p>
          Simplified boundaries from the ONS Open Geography Portal (contains OS data © Crown
          copyright and database right). Postcode search uses postcodes.io. The processing
          scripts are in the <A href="https://github.com/EddieDavison92/life-expectancy-uk">GitHub repository</A>.
        </p>
      </Section>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 leading-relaxed">
      <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
      {children}
    </section>
  )
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-teal-800 underline underline-offset-2 hover:text-teal-950">
      {children}
    </a>
  )
}

function Links({ items }: { items: [string, string][] }) {
  return (
    <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {items.map(([label, href]) => (
        <A key={href} href={href}>
          {label}
        </A>
      ))}
    </p>
  )
}
